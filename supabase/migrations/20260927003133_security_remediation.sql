-- Security remediation. Apply after the existing schema.sql on live projects.
-- Existing profile/order rows are retained; new writes use the server routes.

alter table public.membership_config add column if not exists treasurer_name text default 'Neha Ramiah';
alter table public.membership_config add column if not exists treasurer_role text default 'Treasurer and MDC';
alter table public.membership_config add column if not exists treasurer_phone text default '+91 6385525264';
alter table public.orders add column if not exists receipt_number text;
alter table public.orders add column if not exists drive_year int default 2026;
alter table public.orders add column if not exists receipt_sent boolean default false;
alter table public.orders add column if not exists receipt_sent_at timestamptz;
alter table public.orders add column if not exists receipt_error text;
alter table public.orders add column if not exists tshirt_size text;

-- Verification history identifies an auth account, not a currently active
-- admin row. This permits whitelist revocation without deleting old orders.
alter table public.orders drop constraint if exists orders_verified_by_fkey;
alter table public.orders drop constraint if exists orders_verified_by_auth_user_fkey;
alter table public.orders add constraint orders_verified_by_auth_user_fkey
  foreign key (verified_by) references auth.users(id) on delete set null;

create unique index if not exists orders_receipt_number_unique on public.orders(receipt_number) where receipt_number is not null;

create table if not exists public.checkout_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  order_reference text not null unique,
  drive_year int not null,
  base_fee numeric not null check (base_fee >= 0),
  total_amount numeric not null check (total_amount >= 0),
  chapter_snapshot jsonb not null default '[]'::jsonb check (jsonb_typeof(chapter_snapshot) = 'array'),
  expires_at timestamptz not null,
  submitted_order_id uuid references public.orders(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.receipt_counters (
  drive_year int primary key,
  last_number bigint not null default 0 check (last_number >= 0)
);

create table if not exists public.issued_receipts (
  id uuid primary key default gen_random_uuid(),
  receipt_number text not null unique,
  drive_year int not null,
  sequence_number bigint not null,
  kind text not null check (kind in ('order', 'manual')),
  order_id uuid unique references public.orders(id) on delete restrict,
  actor_id uuid not null references auth.users(id),
  recipient_email text not null,
  student_name text not null,
  amount numeric not null check (amount >= 0),
  chapters text[] not null default '{}',
  reason text,
  delivery_status text not null default 'reserved' check (delivery_status in ('reserved', 'sent', 'failed')),
  sent_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  unique (drive_year, sequence_number)
);

create table if not exists public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.checkout_intents enable row level security;
alter table public.receipt_counters enable row level security;
alter table public.issued_receipts enable row level security;
alter table public.admin_audit_log enable row level security;

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.admins where id = (select auth.uid()));
$$;
revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

revoke all on public.checkout_intents, public.receipt_counters, public.issued_receipts, public.admin_audit_log from public, anon, authenticated;
grant select on public.checkout_intents to service_role;
grant select, insert, update on public.issued_receipts to service_role;
grant select, insert on public.admin_audit_log to service_role;
grant select on public.profiles, public.admins to service_role;
grant select, update on public.membership_config, public.chapters to service_role;
grant select, update on public.orders to service_role;
grant select, insert, update on public.admin_whitelist, public.announcement to service_role;
grant select, insert, update, delete on public.events to service_role;
revoke all on public.profiles from public, anon, authenticated;
grant select, insert, update on public.profiles to authenticated;
revoke all on public.chapters, public.announcement, public.events, public.orders, public.order_items,
  public.admins, public.admin_whitelist from public, anon, authenticated;
grant select on public.chapters, public.announcement, public.events to anon, authenticated;
revoke all on public.membership_config from public, anon, authenticated;
grant select (id, base_fee, payee_vpa, payee_name, drive_year, is_drive_open) on public.membership_config to anon, authenticated;
grant select on public.orders, public.order_items to authenticated;
grant select on public.admins, public.admin_whitelist to authenticated;
revoke insert, update, delete on public.admins, public.admin_whitelist from anon, authenticated;
revoke insert, update, delete on public.orders, public.order_items from anon, authenticated;
revoke insert, update, delete on public.membership_config from anon, authenticated;
revoke insert, update, delete on public.chapters, public.announcement, public.events from anon;
revoke update, delete on public.chapters, public.announcement, public.events from authenticated;
revoke insert, update, delete on storage.objects from public, anon, authenticated;
grant select on storage.objects to authenticated;
grant select, insert, update, delete on storage.objects to service_role;

drop policy if exists "admins manage admins" on public.admins;
drop policy if exists "admins manage whitelist" on public.admin_whitelist;
drop policy if exists "members create own orders" on public.orders;
drop policy if exists "members resubmit rejected orders" on public.orders;
drop policy if exists "admins manage orders" on public.orders;
drop policy if exists "members read own orders" on public.orders;
drop policy if exists "members add items to own orders" on public.order_items;
drop policy if exists "admins read items" on public.order_items;
drop policy if exists "members read own items" on public.order_items;
drop policy if exists "read own admin row" on public.admins;
drop policy if exists "admins read whitelist" on public.admin_whitelist;
drop policy if exists "config is public" on public.membership_config;
drop policy if exists "admins manage config" on public.membership_config;
drop policy if exists "admins manage chapters" on public.chapters;
drop policy if exists "admins manage announcement" on public.announcement;
drop policy if exists "admins manage events" on public.events;
drop policy if exists "members upload own proofs" on storage.objects;
drop policy if exists "members update own proofs" on storage.objects;
drop policy if exists "members read own proofs" on storage.objects;

-- Remove any legacy/custom permissive write policies on protected tables too;
-- table grants and server endpoints are the sole write path after this point.
do $$
declare
  policy_row record;
begin
  for policy_row in
    select schemaname, tablename, policyname
      from pg_policies
     where (schemaname = 'public' and tablename = any(array[
       'orders', 'order_items', 'admins', 'admin_whitelist', 'membership_config',
       'chapters', 'announcement', 'events'
     ]) and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
        or (schemaname = 'storage' and tablename = 'objects' and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL'))
  loop
    execute format('drop policy %I on %I.%I', policy_row.policyname, policy_row.schemaname, policy_row.tablename);
  end loop;
end;
$$;

create policy "public checkout config" on public.membership_config for select to anon, authenticated using (id = 1);
create policy "members read own orders" on public.orders for select to authenticated using (user_id = (select auth.uid()));
create policy "admins read orders" on public.orders for select to authenticated using (public.is_admin());
create policy "members read own items" on public.order_items for select to authenticated
  using (exists (select 1 from public.orders o where o.id = order_id and o.user_id = (select auth.uid())));
create policy "admins read order items" on public.order_items for select to authenticated using (public.is_admin());
create policy "read own admin row" on public.admins for select to authenticated using (id = (select auth.uid()));
create policy "admins read whitelist" on public.admin_whitelist for select to authenticated using (public.is_admin());

-- Only administrators can read private payment proofs. Uploads go through the
-- authenticated Next.js endpoint, which validates bytes and chooses the path.
create policy "admins read all proofs" on storage.objects for select to authenticated
  using (bucket_id = 'public-assets' and public.is_admin());

create or replace function public.sync_admin_from_whitelist()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    delete from public.admins a using auth.users u
      where a.id = u.id and lower(u.email) = lower(old.email);
    return old;
  end if;

  if tg_op = 'UPDATE' and lower(old.email) <> lower(new.email) then
    delete from public.admins a using auth.users u
      where a.id = u.id and lower(u.email) = lower(old.email);
  end if;

  delete from public.admins a using auth.users u
    where a.id = u.id and lower(u.email) = lower(new.email) and not exists (
      select 1 from public.admin_whitelist w where lower(w.email) = lower(new.email)
    );
  insert into public.admins (id, full_name, role)
    select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 'admin'
    from auth.users u where lower(u.email) = lower(new.email)
    on conflict (id) do update set full_name = excluded.full_name, role = 'admin';
  return new;
end;
$$;
revoke all on function public.sync_admin_from_whitelist() from public, anon, authenticated;

drop trigger if exists on_auth_user_admin_check on auth.users;
drop trigger if exists on_auth_user_admin_email_change on auth.users;
drop trigger if exists on_auth_user_admin_signup on auth.users;
drop trigger if exists sync_admin_whitelist on public.admin_whitelist;
create trigger sync_admin_whitelist after insert or update or delete on public.admin_whitelist
  for each row execute function public.sync_admin_from_whitelist();

create or replace function public.sync_admin_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if lower(coalesce(old.email, '')) <> lower(coalesce(new.email, '')) then
    if exists (select 1 from public.admin_whitelist w where lower(w.email) = lower(new.email)) then
      insert into public.admins (id, full_name, role)
      values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'admin')
      on conflict (id) do update set full_name = excluded.full_name, role = 'admin';
    else
      delete from public.admins where id = new.id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_admin_email_change() from public, anon, authenticated;
create trigger on_auth_user_admin_email_change after update of email on auth.users
  for each row execute function public.sync_admin_email_change();

create or replace function public.provision_admin_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.admin_whitelist w where lower(w.email) = lower(new.email)) then
    insert into public.admins (id, full_name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), 'admin')
    on conflict (id) do update set full_name = excluded.full_name, role = 'admin';
  end if;
  return new;
end;
$$;
revoke all on function public.provision_admin_for_auth_user() from public, anon, authenticated;
create trigger on_auth_user_admin_signup after insert on auth.users
  for each row execute function public.provision_admin_for_auth_user();

-- Backfill active admins from the current allowlist and remove stale grants.
insert into public.admins (id, full_name, role)
select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), 'admin'
from auth.users u join public.admin_whitelist w on lower(w.email) = lower(u.email)
on conflict (id) do update set full_name = excluded.full_name, role = 'admin';
delete from public.admins a where not exists (
  select 1 from auth.users u join public.admin_whitelist w on lower(w.email) = lower(u.email) where u.id = a.id
);

-- Preserve and import existing official numbers so new issuance continues the
-- same annual sequence and resends reuse the legacy number.
insert into public.issued_receipts
  (receipt_number, drive_year, sequence_number, kind, order_id, actor_id, recipient_email, student_name, amount, chapters, delivery_status, sent_at)
select o.receipt_number,
       substring(o.receipt_number from '^(\d{4})-\d{2} - ')::int,
       substring(o.receipt_number from ' - (\d+)$')::bigint,
       'order', o.id, coalesce(o.verified_by, o.user_id), p.email, p.full_name, o.total_amount,
       coalesce(array_agg(c.name order by c.display_order) filter (where c.id is not null), '{}'),
       case when o.receipt_sent then 'sent' else 'reserved' end,
       o.receipt_sent_at
  from public.orders o
  join public.profiles p on p.id = o.user_id
  left join public.order_items oi on oi.order_id = o.id
  left join public.chapters c on c.id = oi.chapter_id
 where o.receipt_number ~ '^\d{4}-\d{2} - \d+$'
 group by o.receipt_number, o.id, p.email, p.full_name
on conflict (receipt_number) do nothing;
insert into public.receipt_counters (drive_year, last_number)
select drive_year, max(sequence_number) from public.issued_receipts group by drive_year
on conflict (drive_year) do update set last_number = greatest(public.receipt_counters.last_number, excluded.last_number);

create or replace function public.create_checkout_intent(p_user_id uuid, p_chapter_ids uuid[])
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_config public.membership_config%rowtype;
  v_intent public.checkout_intents%rowtype;
  v_chapters jsonb;
  v_total numeric;
  v_ref text;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  select * into strict v_config from public.membership_config where id = 1 for share;
  if not coalesce(v_config.is_drive_open, false) then raise exception 'Membership drive is closed'; end if;
  if cardinality(coalesce(p_chapter_ids, '{}'::uuid[])) > 6 then raise exception 'Too many chapters'; end if;

  select coalesce(jsonb_agg(jsonb_build_object('id', c.id, 'name', c.name, 'code', c.code, 'price', c.price) order by c.display_order), '[]'::jsonb),
         coalesce(sum(c.price), 0)
    into v_chapters, v_total
    from public.chapters c
   where c.id = any(coalesce(p_chapter_ids, '{}'::uuid[])) and c.is_active is true;
  if jsonb_array_length(v_chapters) <> cardinality(coalesce(p_chapter_ids, '{}'::uuid[])) then
    raise exception 'One or more selected chapters are unavailable';
  end if;
  v_ref := 'BMSCE-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  insert into public.checkout_intents (user_id, order_reference, drive_year, base_fee, total_amount, chapter_snapshot, expires_at)
  values (p_user_id, v_ref, v_config.drive_year, v_config.base_fee, v_config.base_fee + v_total, v_chapters, now() + interval '24 hours')
  returning * into v_intent;
  return jsonb_build_object('id', v_intent.id, 'order_reference', v_ref, 'drive_year', v_intent.drive_year,
    'base_fee', v_intent.base_fee, 'total_amount', v_intent.total_amount, 'chapters', v_intent.chapter_snapshot,
    'payee_vpa', v_config.payee_vpa, 'payee_name', v_config.payee_name, 'expires_at', v_intent.expires_at);
end;
$$;
revoke all on function public.create_checkout_intent(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.create_checkout_intent(uuid, uuid[]) to service_role;

create or replace function public.submit_checkout_intent(p_user_id uuid, p_intent_id uuid, p_proof_path text, p_utr text, p_tshirt_size text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_intent public.checkout_intents%rowtype;
  v_order_id uuid;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  if p_utr !~ '^\d{12}$' then raise exception 'Invalid UPI reference'; end if;
  if p_tshirt_size not in ('S', 'M', 'L', 'XL', '2XL', '3XL') then raise exception 'Invalid T-shirt size'; end if;
  if p_proof_path !~ ('^' || p_user_id::text || '/[A-Z0-9-]+\.(png|jpg|webp)$') then raise exception 'Invalid proof path'; end if;
  select * into v_intent from public.checkout_intents where id = p_intent_id and user_id = p_user_id for update;
  if not found or v_intent.expires_at <= now() then raise exception 'Checkout quote expired'; end if;
  if v_intent.submitted_order_id is not null then return v_intent.submitted_order_id; end if;
  insert into public.orders (user_id, base_fee, total_amount, status, payment_screenshot_url, utr_reference, order_reference, drive_year, tshirt_size)
  values (p_user_id, v_intent.base_fee, v_intent.total_amount, 'pending', p_proof_path, p_utr, v_intent.order_reference, v_intent.drive_year, p_tshirt_size)
  returning id into v_order_id;
  insert into public.order_items (order_id, chapter_id, price_at_purchase)
  select v_order_id, (item->>'id')::uuid, (item->>'price')::numeric from jsonb_array_elements(v_intent.chapter_snapshot) item;
  update public.checkout_intents set submitted_order_id = v_order_id where id = v_intent.id;
  return v_order_id;
end;
$$;
revoke all on function public.submit_checkout_intent(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.submit_checkout_intent(uuid, uuid, text, text, text) to service_role;

create or replace function public.resubmit_rejected_order(p_user_id uuid, p_order_id uuid, p_proof_path text, p_utr text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  if p_utr !~ '^\d{12}$' then raise exception 'Invalid UPI reference'; end if;
  if p_proof_path !~ ('^' || p_user_id::text || '/[A-Z0-9-]+-R[A-F0-9]{10}\.(png|jpg|webp)$') then raise exception 'Invalid proof path'; end if;
  update public.orders set status = 'pending', payment_screenshot_url = p_proof_path,
    utr_reference = p_utr, rejection_reason = null, verified_at = null, verified_by = null
  where id = p_order_id and user_id = p_user_id and status = 'rejected';
  if not found then raise exception 'Application is not eligible for resubmission'; end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  select p_user_id, u.email, 'order.proof_resubmitted', 'order', p_order_id::text, '{}'::jsonb
  from auth.users u where u.id = p_user_id;
end;
$$;
revoke all on function public.resubmit_rejected_order(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function public.resubmit_rejected_order(uuid, uuid, text, text) to service_role;

create or replace function public.reserve_order_receipt(p_order_id uuid, p_actor_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_order public.orders%rowtype;
  v_profile public.profiles%rowtype;
  v_receipt_id uuid;
  v_year int;
  v_seq bigint;
  v_number text;
  v_chapters text[];
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  select * into strict v_order from public.orders where id = p_order_id for update;
  if v_order.status <> 'verified' then raise exception 'Order must be verified'; end if;
  select * into strict v_profile from public.profiles where id = v_order.user_id;
  select u.email into v_profile.email from auth.users u where u.id = v_order.user_id;
  select coalesce(array_agg(c.name order by c.display_order), '{}') into v_chapters
    from public.order_items oi join public.chapters c on c.id = oi.chapter_id where oi.order_id = v_order.id;
  if v_order.receipt_number is not null then
    select id into v_receipt_id from public.issued_receipts where order_id = v_order.id;
    if v_receipt_id is null then
      -- Preserve nonstandard historical receipt numbers while reserving a
      -- sequence slot so future issuance does not collide with the old series.
      v_year := coalesce(v_order.drive_year, 2026);
      insert into public.receipt_counters (drive_year, last_number) values (v_year, 1)
        on conflict (drive_year) do update set last_number = public.receipt_counters.last_number + 1 returning last_number into v_seq;
      insert into public.issued_receipts (receipt_number, drive_year, sequence_number, kind, order_id, actor_id, recipient_email, student_name, amount, chapters)
      values (v_order.receipt_number, v_year, v_seq, 'order', v_order.id, p_actor_id, v_profile.email, v_profile.full_name, v_order.total_amount, v_chapters)
      returning id into v_receipt_id;
      insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
      select p_actor_id, u.email, 'receipt.legacy_imported', 'receipt', v_receipt_id::text,
        jsonb_build_object('receipt_number', v_order.receipt_number, 'order_id', v_order.id)
      from auth.users u where u.id = p_actor_id;
    end if;
    return jsonb_build_object('id', (select id from public.issued_receipts where order_id = v_order.id),
      'receipt_number', v_order.receipt_number, 'drive_year', coalesce(v_order.drive_year, 2026),
      'recipient_email', v_profile.email, 'student_name', v_profile.full_name,
      'amount', v_order.total_amount, 'chapters', to_jsonb(v_chapters));
  end if;
  v_year := coalesce(v_order.drive_year, 2026);
  insert into public.receipt_counters (drive_year, last_number) values (v_year, 1)
    on conflict (drive_year) do update set last_number = public.receipt_counters.last_number + 1 returning last_number into v_seq;
  v_number := v_year::text || '-' || right((v_year + 1)::text, 2) || ' - ' || lpad(v_seq::text, 3, '0');
  insert into public.issued_receipts (receipt_number, drive_year, sequence_number, kind, order_id, actor_id, recipient_email, student_name, amount, chapters)
  values (v_number, v_year, v_seq, 'order', v_order.id, p_actor_id, v_profile.email, v_profile.full_name, v_order.total_amount, v_chapters)
  returning id into v_receipt_id;
  update public.orders set receipt_number = v_number where id = v_order.id;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  select p_actor_id, u.email, 'receipt.reserved', 'receipt', v_receipt_id::text,
    jsonb_build_object('receipt_number', v_number, 'order_id', v_order.id)
  from auth.users u where u.id = p_actor_id;
  return jsonb_build_object('id', v_receipt_id, 'receipt_number', v_number, 'drive_year', v_year,
    'recipient_email', v_profile.email, 'student_name', v_profile.full_name,
    'amount', v_order.total_amount, 'chapters', to_jsonb(v_chapters));
end;
$$;
revoke all on function public.reserve_order_receipt(uuid, uuid) from public, anon, authenticated;
grant execute on function public.reserve_order_receipt(uuid, uuid) to service_role;

create or replace function public.reserve_manual_receipt(p_actor_id uuid, p_email text, p_name text, p_amount numeric, p_chapters text[], p_reason text)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_year int;
  v_seq bigint;
  v_number text;
  v_id uuid;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  if p_reason is null or length(btrim(p_reason)) < 10 then raise exception 'An override reason of at least 10 characters is required'; end if;
  select drive_year into strict v_year from public.membership_config where id = 1;
  insert into public.receipt_counters (drive_year, last_number) values (v_year, 1)
    on conflict (drive_year) do update set last_number = public.receipt_counters.last_number + 1 returning last_number into v_seq;
  v_number := v_year::text || '-' || right((v_year + 1)::text, 2) || ' - ' || lpad(v_seq::text, 3, '0');
  insert into public.issued_receipts (receipt_number, drive_year, sequence_number, kind, actor_id, recipient_email, student_name, amount, chapters, reason)
  values (v_number, v_year, v_seq, 'manual', p_actor_id, p_email, p_name, p_amount, coalesce(p_chapters, '{}'), btrim(p_reason))
  returning id into v_id;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  select p_actor_id, u.email, 'receipt.manual_reserved', 'receipt', v_id::text,
    jsonb_build_object('receipt_number', v_number, 'recipient_email', p_email, 'amount', p_amount, 'reason', btrim(p_reason))
  from auth.users u where u.id = p_actor_id;
  return jsonb_build_object('id', v_id, 'receipt_number', v_number, 'drive_year', v_year,
    'recipient_email', p_email, 'student_name', p_name, 'amount', p_amount, 'chapters', to_jsonb(coalesce(p_chapters, '{}')));
end;
$$;
revoke all on function public.reserve_manual_receipt(uuid, text, text, numeric, text[], text) from public, anon, authenticated;
grant execute on function public.reserve_manual_receipt(uuid, text, text, numeric, text[], text) to service_role;

create or replace function public.record_admin_audit(p_actor_id uuid, p_actor_email text, p_action text, p_entity_type text, p_entity_id text, p_details jsonb default '{}'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  values (p_actor_id, p_actor_email, p_action, p_entity_type, p_entity_id, coalesce(p_details, '{}'::jsonb));
end;
$$;
revoke all on function public.record_admin_audit(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.record_admin_audit(uuid, text, text, text, text, jsonb) to service_role;

create or replace function public.revoke_admin_whitelist(p_email text, p_actor_id uuid, p_actor_email text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  perform pg_advisory_xact_lock(hashtext('admin_whitelist_last_admin_guard')::bigint);
  if lower(p_email) = lower(p_actor_email) then raise exception 'Cannot revoke your own access'; end if;
  if (select count(*) from public.admin_whitelist) <= 1 then raise exception 'Cannot remove the last administrator'; end if;
  delete from public.admin_whitelist where lower(email) = lower(p_email);
  if not found then raise exception 'Administrator was not found'; end if;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  values (p_actor_id, p_actor_email, 'admin.whitelist_removed', 'admin_whitelist', lower(p_email), '{}'::jsonb);
end;
$$;
revoke all on function public.revoke_admin_whitelist(text, uuid, text) from public, anon, authenticated;
grant execute on function public.revoke_admin_whitelist(text, uuid, text) to service_role;

create or replace function public.set_order_status(p_order_id uuid, p_actor_id uuid, p_actor_email text, p_status text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_old_status text;
begin
  if current_setting('request.jwt.claim.role', true) is distinct from 'service_role' then raise exception 'forbidden'; end if;
  if p_status not in ('verified', 'rejected') then raise exception 'Invalid order status'; end if;
  if p_status = 'rejected' and length(btrim(coalesce(p_reason, ''))) = 0 then raise exception 'A rejection reason is required'; end if;
  select status into strict v_old_status from public.orders where id = p_order_id for update;
  if v_old_status <> 'pending' then raise exception 'Only pending orders can be reviewed'; end if;
  update public.orders set status = p_status,
    verified_at = case when p_status = 'verified' then now() else null end,
    verified_by = case when p_status = 'verified' then p_actor_id else null end,
    rejection_reason = case when p_status = 'rejected' then btrim(p_reason) else null end
  where id = p_order_id;
  insert into public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  values (p_actor_id, p_actor_email, 'order.status_changed', 'order', p_order_id::text,
    jsonb_build_object('from', v_old_status, 'to', p_status, 'reason', case when p_status = 'rejected' then btrim(p_reason) else null end));
end;
$$;
revoke all on function public.set_order_status(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.set_order_status(uuid, uuid, text, text, text) to service_role;

-- Keep uploaded payment evidence private and bounded. The service role performs
-- authenticated uploads; only administrators can read objects through RLS.
update storage.buckets set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp']
where id = 'public-assets';

-- Seed a deployment-safe private bucket when a fresh project did not create it.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('public-assets', 'public-assets', false, 5242880, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do update set public = false, file_size_limit = 5242880,
  allowed_mime_types = array['image/png', 'image/jpeg', 'image/webp'];

-- Existing data remains queryable to its owner/admin; new workflows write only
-- through service-role endpoints and the narrowly granted routines above.
