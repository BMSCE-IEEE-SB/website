-- ==============================================================================
-- BMSCE IEEE — Consolidated & Hardened Supabase Migration (19 Oct 2026)
-- Apply this file in the Supabase SQL Editor.
-- Safe to re-run: all statements are idempotent.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. Helper: Ensure public.is_admin() is explicitly defined and accessible
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = (SELECT auth.uid())
  );
$$;
REVOKE ALL ON FUNCTION public.is_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;


-- ==============================================================================
-- 2. Privileged admin check and RLS policies (Restricts SAC to Xtreme only)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.is_privileged_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE id = (SELECT auth.uid())
      AND lower(coalesce(role, 'admin')) <> 'sac'
  );
$$;
REVOKE ALL ON FUNCTION public.is_privileged_admin() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.is_privileged_admin() TO authenticated, service_role;

DROP POLICY IF EXISTS "admins manage chapters" ON public.chapters;
CREATE POLICY "admins manage chapters" ON public.chapters
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins manage config" ON public.membership_config;
CREATE POLICY "admins manage config" ON public.membership_config
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins manage announcement" ON public.announcement;
CREATE POLICY "admins manage announcement" ON public.announcement
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins manage events" ON public.events;
CREATE POLICY "admins manage events" ON public.events
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins manage admins" ON public.admins;
CREATE POLICY "admins manage admins" ON public.admins
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins manage whitelist" ON public.admin_whitelist;
CREATE POLICY "admins manage whitelist" ON public.admin_whitelist
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins update profiles" ON public.profiles;
CREATE POLICY "admins update profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());

DROP POLICY IF EXISTS "admins manage orders" ON public.orders;
CREATE POLICY "admins manage orders" ON public.orders
  FOR ALL TO authenticated
  USING (is_privileged_admin()) WITH CHECK (is_privileged_admin());



-- ==============================================================================
-- 3. Sequential Faculty Proctor Queue & Capacity Columns
-- ==============================================================================

ALTER TABLE public.xtreme_proctors
  ADD COLUMN IF NOT EXISTS capacity int NOT NULL DEFAULT 20
    CHECK (capacity > 0 AND capacity <= 500);

ALTER TABLE public.xtreme_proctors
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- Safely unassign teams linked to sample proctors before removing them
UPDATE public.xtreme_teams
SET proctor_id = NULL,
    proctor_name = NULL,
    proctor_ieee_id = NULL,
    updated_at = now()
WHERE proctor_ieee_id IN ('90451234', '90455678');

DELETE FROM public.xtreme_proctors
WHERE ieee_id IN ('90451234', '90455678');

-- Preserve order for existing proctors by creation time
WITH ranked AS (
  SELECT id, (row_number() OVER (ORDER BY created_at ASC, id ASC)) * 10 AS rn
  FROM public.xtreme_proctors
)
UPDATE public.xtreme_proctors p
SET sort_order = ranked.rn
FROM ranked
WHERE p.id = ranked.id AND p.sort_order = 0;

-- Seed verified BMSCE faculty proctors with designated squad limits
INSERT INTO public.xtreme_proctors (name, ieee_id, capacity, sort_order)
VALUES
  ('Swaroop BM', '102196859', 15, 10),
  ('Nethravathi S', '90893108', 20, 20)
ON CONFLICT (ieee_id) DO UPDATE SET
  name = excluded.name,
  capacity = excluded.capacity,
  sort_order = excluded.sort_order;


-- ==============================================================================
-- 4. assign_proctor_to_team RPC (with row lock & capacity check)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.assign_proctor_to_team(
  p_team_id uuid,
  p_proctor_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_proctor public.xtreme_proctors%ROWTYPE;
  v_current_count int;
  v_cap int;
  v_team_exists boolean;
BEGIN
  -- Authorization check: service_role or admin
  IF coalesce(auth.role(), '') <> 'service_role'
     AND current_setting('role', true) NOT IN ('postgres', 'service_role')
     AND (auth.uid() IS NULL OR NOT public.is_admin()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE id = p_team_id) INTO v_team_exists;
  IF NOT v_team_exists THEN
    RAISE EXCEPTION 'Team not found.';
  END IF;

  -- Case 1: Unassign proctor (p_proctor_id IS NULL)
  IF p_proctor_id IS NULL THEN
    UPDATE public.xtreme_teams
    SET proctor_id = NULL,
        proctor_name = NULL,
        proctor_ieee_id = NULL,
        updated_at = now()
    WHERE id = p_team_id;

    RETURN jsonb_build_object(
      'success', true,
      'unassigned', true
    );
  END IF;

  -- Case 2: Assign specified proctor (row lock prevents concurrency overfill)
  SELECT * INTO v_proctor
  FROM public.xtreme_proctors
  WHERE id = p_proctor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proctor not found.';
  END IF;

  v_cap := coalesce(v_proctor.capacity, 20);

  -- Count existing teams assigned to this proctor (excluding this team to avoid self-count)
  SELECT count(*) INTO v_current_count
  FROM public.xtreme_teams
  WHERE (proctor_id = v_proctor.id OR proctor_ieee_id = v_proctor.ieee_id)
    AND id <> p_team_id;

  IF v_current_count >= v_cap THEN
    RAISE EXCEPTION 'Proctor "%" (%) already has % squads assigned.', v_proctor.name, v_proctor.ieee_id, v_cap;
  END IF;

  UPDATE public.xtreme_teams
  SET proctor_id = v_proctor.id,
      proctor_name = v_proctor.name,
      proctor_ieee_id = v_proctor.ieee_id,
      updated_at = now()
  WHERE id = p_team_id;

  RETURN jsonb_build_object(
    'success', true,
    'proctor_id', v_proctor.id,
    'proctor_name', v_proctor.name,
    'proctor_ieee_id', v_proctor.ieee_id,
    'assigned_count', v_current_count + 1,
    'capacity', v_cap
  );
END;
$$;

REVOKE ALL ON FUNCTION public.assign_proctor_to_team(uuid, uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.assign_proctor_to_team(uuid, uuid) TO authenticated, service_role;


-- ==============================================================================
-- 5. auto_assign_proctor RPC (Sequential Queue with rollover on race conditions)
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.auto_assign_proctor(
  p_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_proctor RECORD;
  v_assigned_res jsonb;
  v_success boolean := false;
BEGIN
  -- Iterate through proctors in sequential queue order
  FOR v_proctor IN
    SELECT p.id
    FROM public.xtreme_proctors p
    ORDER BY p.sort_order ASC, p.created_at ASC, p.id ASC
  LOOP
    BEGIN
      -- Try assigning to this proctor (assign_proctor_to_team acquires lock and checks capacity)
      v_assigned_res := public.assign_proctor_to_team(p_team_id, v_proctor.id);
      IF coalesce((v_assigned_res->>'success')::boolean, false) IS TRUE THEN
        v_success := true;
        EXIT; -- Successfully assigned; stop loop
      END IF;
    EXCEPTION WHEN OTHERS THEN
      -- If capacity was filled by a concurrent transaction, rollover to the next proctor in queue
      CONTINUE;
    END;
  END LOOP;

  IF v_success THEN
    RETURN jsonb_build_object(
      'success', true,
      'assigned', true,
      'assignment', v_assigned_res
    );
  ELSE
    -- All proctors in queue are full (or no proctor exists); squad stays "Pending Proctor"
    RETURN jsonb_build_object(
      'success', true,
      'assigned', false,
      'reason', 'No proctor available with remaining capacity.'
    );
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_assign_proctor(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.auto_assign_proctor(uuid) TO authenticated, service_role;

COMMIT;
