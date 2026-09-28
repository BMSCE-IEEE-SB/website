-- Fix membership config base fee
UPDATE public.membership_config
SET base_fee = 1850
WHERE id = 1;

-- Fix Chapters
-- 1. Rename WIE, set code WIE, price 0
UPDATE public.chapters
SET name = 'IEEE Women in Engineering'
WHERE code = 'WIE';

-- 2. Insert SC (Sensors Council), free
INSERT INTO public.chapters (id, name, code, slug, price, display_order, is_active)
VALUES ('00000000-0000-0000-0000-00000000005c', 'IEEE Sensors Council', 'SC', 'sc', 0, 5, true)
ON CONFLICT (code) DO UPDATE SET price = 0, name = 'IEEE Sensors Council', slug = 'sc', is_active = true, display_order = 5;

-- Fix RPCs: Allow XS tshirt size, allow UTR to be optional, fix empty string jsonb cast crash

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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
  if p_utr is not null and p_utr <> '' and p_utr !~ '^\d{12}$' then raise exception 'Invalid UPI reference'; end if;
  if p_tshirt_size not in ('XS', 'S', 'M', 'L', 'XL', '2XL', '3XL') then raise exception 'Invalid T-shirt size'; end if;
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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
  if p_utr is not null and p_utr <> '' and p_utr !~ '^\d{12}$' then raise exception 'Invalid UPI reference'; end if;
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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
  select * into strict v_order from public.orders where id = p_order_id for update;
  if v_order.status <> 'verified' then raise exception 'Order must be verified'; end if;
  select * into strict v_profile from public.profiles where id = v_order.user_id;
  select u.email into v_profile.email from auth.users u where u.id = v_order.user_id;
  select coalesce(array_agg(c.name order by c.display_order), '{}') into v_chapters
    from public.order_items oi join public.chapters c on c.id = oi.chapter_id where oi.order_id = v_order.id;
  if v_order.receipt_number is not null then
    select id into v_receipt_id from public.issued_receipts where order_id = v_order.id;
    if v_receipt_id is null then
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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
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
  if coalesce(nullif(current_setting('request.jwt.claim.role', true), ''), nullif(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) not in ('service_role', '"service_role"') then raise exception 'forbidden'; end if;
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

