-- UG/PG registration programs. Each program has its own fees, set in admin
-- settings (membership_config.pg_base_fee, chapters.pg_price). The program is
-- chosen on the profile step, priced server-side in create_checkout_intent,
-- and carried onto checkout intents and orders.

alter table public.profiles add column if not exists program text not null default 'UG'
  check (program in ('UG', 'PG'));
alter table public.checkout_intents add column if not exists program text not null default 'UG'
  check (program in ('UG', 'PG'));
alter table public.orders add column if not exists program text not null default 'UG'
  check (program in ('UG', 'PG'));

-- Per-program fees. PG starts equal to UG; the branch sets both in admin.
alter table public.membership_config add column if not exists pg_base_fee numeric not null default 1850
  check (pg_base_fee >= 0);
alter table public.chapters add column if not exists pg_price numeric default 0
  check (pg_price >= 0);
update public.chapters set pg_price = price where pg_price is distinct from price and price > 0;
alter table public.chapters alter column pg_price set not null;
alter table public.chapters alter column pg_price set default 0;

-- Replace the 2-argument intent function with a 3-argument version carrying
-- the program (default UG, so older callers keep working).
drop function if exists public.create_checkout_intent(uuid, uuid[]);

create or replace function public.create_checkout_intent(p_user_id uuid, p_chapter_ids uuid[], p_program text default 'UG')
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config public.membership_config%rowtype;
  v_intent public.checkout_intents%rowtype;
  v_chapters jsonb;
  v_chapter_total numeric;
  v_program text;
  v_base numeric;
  v_total numeric;
  v_ref text;
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), current_setting('request.jwt.claims', true)::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
  v_program := coalesce(nullif(p_program, ''), 'UG');
  if v_program not in ('UG', 'PG') then raise exception 'Unknown program'; end if;
  select * into strict v_config from public.membership_config where id = 1 for share;
  if not coalesce(v_config.is_drive_open, false) then raise exception 'Membership drive is closed'; end if;
  if cardinality(coalesce(p_chapter_ids, '{}'::uuid[])) > 6 then raise exception 'Too many chapters'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code,
      'price', case when v_program = 'PG' then c.pg_price else c.price end) order by c.display_order), '[]'::jsonb),
         coalesce(sum(case when v_program = 'PG' then c.pg_price else c.price end), 0)
    into v_chapters, v_chapter_total
    from public.chapters c
   where c.id = any(coalesce(p_chapter_ids, '{}'::uuid[])) and c.is_active is true;
  if jsonb_array_length(v_chapters) <> cardinality(coalesce(p_chapter_ids, '{}'::uuid[])) then
    raise exception 'One or more selected chapters are unavailable';
  end if;
  v_base := case when v_program = 'PG' then v_config.pg_base_fee else v_config.base_fee end;
  v_total := v_base + v_chapter_total;
  v_ref := 'BMSCE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.checkout_intents (user_id, order_reference, drive_year, base_fee, total_amount, chapter_snapshot, program, expires_at)
  values (p_user_id, v_ref, v_config.drive_year, v_base, v_total, v_chapters, v_program, now() + interval '24 hours')
  returning * into v_intent;
  return jsonb_build_object('id', v_intent.id, 'order_reference', v_ref, 'drive_year', v_intent.drive_year,
    'program', v_intent.program, 'base_fee', v_intent.base_fee, 'total_amount', v_intent.total_amount, 'chapters', v_intent.chapter_snapshot,
    'payee_vpa', v_config.payee_vpa, 'payee_name', v_config.payee_name, 'expires_at', v_intent.expires_at);
end;
$$;
revoke all on function public.create_checkout_intent(uuid, uuid[], text) from public, anon, authenticated;
grant execute on function public.create_checkout_intent(uuid, uuid[], text) to service_role;

-- Carry the intent program onto the submitted order. The old 5-argument
-- version is replaced: the checkout route already sends p_payment_method,
-- which previously matched no function and broke live submissions.
drop function if exists public.submit_checkout_intent(uuid, uuid, text, text, text);

create or replace function public.submit_checkout_intent(p_user_id uuid, p_intent_id uuid, p_proof_path text, p_utr text, p_tshirt_size text, p_payment_method text default 'UPI')
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent public.checkout_intents%rowtype;
  v_order_id uuid;
  v_method text;
begin
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
  v_method := coalesce(nullif(p_payment_method, ''), 'UPI');
  if v_method not in ('UPI', 'CASH') then raise exception 'Unknown payment method'; end if;
  if p_utr is not null and p_utr <> '' and p_utr !~ '^\d{12}$' then raise exception 'Invalid UPI reference'; end if;
  if p_tshirt_size not in ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL') then raise exception 'Invalid T-shirt size'; end if;
  if v_method = 'UPI' and p_proof_path !~ ('^' || p_user_id::text || '/[A-Z0-9-]+\.(png|jpg|webp)$') then raise exception 'Invalid proof path'; end if;
  select * into v_intent from public.checkout_intents where id = p_intent_id and user_id = p_user_id for update;
  if not found or v_intent.expires_at <= now() then raise exception 'Checkout quote expired'; end if;
  if v_intent.submitted_order_id is not null then return v_intent.submitted_order_id; end if;
  insert into public.orders (user_id, base_fee, total_amount, status, payment_screenshot_url, utr_reference, order_reference, drive_year, tshirt_size, program, payment_method)
  values (p_user_id, v_intent.base_fee, v_intent.total_amount, 'pending', p_proof_path, p_utr, v_intent.order_reference, v_intent.drive_year, p_tshirt_size, coalesce(v_intent.program, 'UG'), v_method)
  returning id into v_order_id;
  insert into public.order_items (order_id, chapter_id, price_at_purchase)
  select v_order_id, (item->>'id')::uuid, (item->>'price')::numeric from jsonb_array_elements(v_intent.chapter_snapshot) item;
  update public.checkout_intents set submitted_order_id = v_order_id where id = v_intent.id;
  return v_order_id;
end;
$$;
revoke all on function public.submit_checkout_intent(uuid, uuid, text, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_checkout_intent(uuid, uuid, text, text, text, text) to service_role;
