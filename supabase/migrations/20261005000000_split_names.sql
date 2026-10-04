-- 1. Add first_name and last_name with a temporary default to avoid breaking existing rows
ALTER TABLE public.profiles ADD COLUMN first_name text DEFAULT '';
ALTER TABLE public.profiles ADD COLUMN last_name text DEFAULT '';

-- 2. Backfill data
UPDATE public.profiles
SET 
  first_name = split_part(full_name, ' ', 1),
  last_name = CASE 
    WHEN position(' ' in full_name) > 0 THEN substr(full_name, position(' ' in full_name) + 1)
    ELSE ''
  END;

-- 3. Make first_name required and drop the temporary default
ALTER TABLE public.profiles ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN first_name DROP DEFAULT;
ALTER TABLE public.profiles ALTER COLUMN last_name DROP DEFAULT;

-- 4. Drop the old full_name column
ALTER TABLE public.profiles DROP COLUMN full_name;

-- 5. Re-declare reserve_order_receipt to use first_name and last_name
CREATE OR REPLACE FUNCTION public.reserve_order_receipt(p_order_id uuid, p_actor_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_order public.orders%rowtype;
  v_profile public.profiles%rowtype;
  v_receipt_id uuid;
  v_year int;
  v_seq bigint;
  v_number text;
  v_chapters text[];
BEGIN
  IF COALESCE(NULLIF(current_setting('request.jwt.claim.role', true), ''), NULLIF(current_setting('request.jwt.claims', true), '')::jsonb->>'role', current_setting('role')) NOT IN ('service_role', '"service_role"') THEN RAISE EXCEPTION 'forbidden'; END IF;
  SELECT * INTO STRICT v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
  IF v_order.status <> 'verified' THEN RAISE EXCEPTION 'Order must be verified'; END IF;
  SELECT * INTO STRICT v_profile FROM public.profiles WHERE id = v_order.user_id;
  SELECT u.email INTO v_profile.email FROM auth.users u WHERE u.id = v_order.user_id;
  SELECT COALESCE(array_agg(c.name ORDER BY c.display_order), '{}') INTO v_chapters
    FROM public.order_items i JOIN public.chapters c ON i.chapter_id = c.id WHERE i.order_id = v_order.id;

  IF v_order.receipt_number IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM public.issued_receipts WHERE order_id = v_order.id) THEN
      RETURN jsonb_build_object('id', (SELECT id FROM public.issued_receipts WHERE order_id = v_order.id),
        'receipt_number', v_order.receipt_number, 'drive_year', COALESCE(v_order.drive_year, 2026),
        'recipient_email', v_profile.email, 'student_name', btrim(v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')),
        'amount', v_order.total_amount, 'chapters', to_jsonb(v_chapters));
    END IF;
    v_year := COALESCE(v_order.drive_year, 2026);
    SELECT last_number + 1 INTO v_seq FROM public.receipt_counters WHERE drive_year = v_year;
    IF v_seq IS NULL THEN v_seq := 1; END IF;
    INSERT INTO public.receipt_counters (drive_year, last_number) VALUES (v_year, v_seq)
      ON CONFLICT (drive_year) DO UPDATE SET last_number = public.receipt_counters.last_number + 1 RETURNING last_number INTO v_seq;
    INSERT INTO public.issued_receipts (receipt_number, drive_year, sequence_number, kind, order_id, actor_id, recipient_email, student_name, amount, chapters)
    VALUES (v_order.receipt_number, v_year, v_seq, 'order', v_order.id, p_actor_id, v_profile.email, btrim(v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')), v_order.total_amount, v_chapters)
    RETURNING id INTO v_receipt_id;
    INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
    SELECT p_actor_id, u.email, 'receipt.legacy_imported', 'receipt', v_receipt_id::text,
      jsonb_build_object('receipt_number', v_order.receipt_number, 'order_id', v_order.id)
    FROM auth.users u WHERE u.id = p_actor_id;
    RETURN jsonb_build_object('id', (SELECT id FROM public.issued_receipts WHERE order_id = v_order.id),
      'receipt_number', v_order.receipt_number, 'drive_year', COALESCE(v_order.drive_year, 2026),
      'recipient_email', v_profile.email, 'student_name', btrim(v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')),
      'amount', v_order.total_amount, 'chapters', to_jsonb(v_chapters));
  END IF;
  
  v_year := COALESCE(v_order.drive_year, 2026);
  INSERT INTO public.receipt_counters (drive_year, last_number) VALUES (v_year, 1)
    ON CONFLICT (drive_year) DO UPDATE SET last_number = public.receipt_counters.last_number + 1 RETURNING last_number INTO v_seq;
  v_number := v_year::text || '-' || right((v_year + 1)::text, 2) || ' - ' || lpad(v_seq::text, 3, '0');
  INSERT INTO public.issued_receipts (receipt_number, drive_year, sequence_number, kind, order_id, actor_id, recipient_email, student_name, amount, chapters)
  VALUES (v_number, v_year, v_seq, 'order', v_order.id, p_actor_id, v_profile.email, btrim(v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')), v_order.total_amount, v_chapters)
  RETURNING id INTO v_receipt_id;
  UPDATE public.orders SET receipt_number = v_number WHERE id = v_order.id;
  INSERT INTO public.admin_audit_log (actor_id, actor_email, action, entity_type, entity_id, details)
  SELECT p_actor_id, u.email, 'receipt.reserved', 'receipt', v_receipt_id::text,
    jsonb_build_object('receipt_number', v_number, 'order_id', v_order.id)
  FROM auth.users u WHERE u.id = p_actor_id;
  RETURN jsonb_build_object('id', v_receipt_id, 'receipt_number', v_number, 'drive_year', v_year,
    'recipient_email', v_profile.email, 'student_name', btrim(v_profile.first_name || ' ' || COALESCE(v_profile.last_name, '')),
    'amount', v_order.total_amount, 'chapters', to_jsonb(v_chapters));
END;
$$;
