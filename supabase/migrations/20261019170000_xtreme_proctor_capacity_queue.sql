-- Migration: sequential proctor queue with per-proctor squad caps.
--
-- Assignment model: new squads fill proctors strictly in queue order
-- (sort_order, then created_at). Each proctor takes new squads until its
-- own capacity is reached, then the next proctor in line takes over.
-- Admins set "how many squads" when adding each proctor and can adjust it
-- later; existing assignments are always kept (grandfathered).
--
-- This migration:
--   1. Adds capacity + sort_order to xtreme_proctors.
--   2. Removes the old sample proctors (90451234, 90455678) and unassigns
--      any teams pointing at them (Pending Proctor).
--   3. Orders any remaining proctors by creation time.
--   4. Seeds the live queue: #1 Swaroop BM (15 squads), #2 Nethravathi S
--      (20 squads).
--   5. Rewrites assign_proctor_to_team + auto_assign_proctor to enforce
--      per-proctor caps in queue order (row lock kept for races).

-- 1. Columns (idempotent for partial/failed first runs)
ALTER TABLE public.xtreme_proctors
  ADD COLUMN IF NOT EXISTS capacity int NOT NULL DEFAULT 20
    CHECK (capacity > 0 AND capacity <= 500);
ALTER TABLE public.xtreme_proctors
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

-- 2. Remove old sample proctors; affected teams go back to Pending Proctor
UPDATE public.xtreme_teams
SET proctor_id = NULL,
    proctor_name = NULL,
    proctor_ieee_id = NULL,
    updated_at = now()
WHERE proctor_ieee_id IN ('90451234', '90455678');

DELETE FROM public.xtreme_proctors
WHERE ieee_id IN ('90451234', '90455678');

-- 3. Queue any pre-existing proctors by creation time (gaps of 10 leave
-- room if an order ever needs shuffling later)
WITH ranked AS (
  SELECT id, (row_number() OVER (ORDER BY created_at ASC, id ASC)) * 10 AS rn
  FROM public.xtreme_proctors
)
UPDATE public.xtreme_proctors p
SET sort_order = ranked.rn
FROM ranked
WHERE p.id = ranked.id AND p.sort_order = 0;

-- 4. Seed the live queue (runs once; re-runnable without duplicates)
INSERT INTO public.xtreme_proctors (name, ieee_id, capacity, sort_order)
VALUES
  ('Swaroop BM', '102196859', 15, 10),
  ('Nethravathi S', '90893108', 20, 20)
ON CONFLICT (ieee_id) DO UPDATE SET
  name = excluded.name,
  capacity = excluded.capacity,
  sort_order = excluded.sort_order;

-- 5a. Assign RPC with per-proctor capacity (row lock retained)
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
  v_proctor RECORD;
  v_current_count int;
  v_cap int;
  v_team_exists boolean;
BEGIN
  -- Authorization check: admin or service_role caller
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

  -- Case 2: Assign specified proctor
  -- Lock proctor row for concurrency serialization
  SELECT * INTO v_proctor
  FROM public.xtreme_proctors
  WHERE id = p_proctor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proctor not found.';
  END IF;

  v_cap := coalesce(v_proctor.capacity, 20);

  -- Count existing teams assigned to this proctor by IEEE ID (stable identity)
  SELECT count(*) INTO v_current_count
  FROM public.xtreme_teams
  WHERE (proctor_id = v_proctor.id OR proctor_ieee_id = v_proctor.ieee_id)
    AND id <> p_team_id;

  IF v_current_count >= v_cap THEN
    RAISE EXCEPTION 'Proctor "%" (%) already has % squads assigned.', v_proctor.name, v_proctor.ieee_id, v_cap;
  END IF;

  -- Update team with foreign key and denormalized proctor info
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

-- 5b. Auto-assign RPC: first proctor in queue order with remaining capacity
CREATE OR REPLACE FUNCTION public.auto_assign_proctor(
  p_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_proctor_id uuid;
  v_assigned_res jsonb;
BEGIN
  -- First proctor in queue order whose squad count is below its own cap
  SELECT p.id INTO v_proctor_id
  FROM public.xtreme_proctors p
  LEFT JOIN public.xtreme_teams t
    ON (t.proctor_id = p.id OR t.proctor_ieee_id = p.ieee_id)
  GROUP BY p.id, p.sort_order, p.created_at
  HAVING count(DISTINCT t.id) < coalesce(max(p.capacity), 20)
  ORDER BY p.sort_order ASC, p.created_at ASC, p.id ASC
  LIMIT 1;

  IF v_proctor_id IS NULL THEN
    -- Every proctor is full; leave team unassigned (Pending Proctor) until
    -- an admin adds capacity
    RETURN jsonb_build_object(
      'success', true,
      'assigned', false,
      'reason', 'No proctor available with remaining capacity.'
    );
  END IF;

  -- Delegate to assign_proctor_to_team which acquires the lock and verifies capacity
  v_assigned_res := public.assign_proctor_to_team(p_team_id, v_proctor_id);
  RETURN jsonb_build_object(
    'success', true,
    'assigned', true,
    'assignment', v_assigned_res
  );
EXCEPTION WHEN OTHERS THEN
  -- Fallback if race condition occurred on capacity
  RETURN jsonb_build_object(
    'success', false,
    'assigned', false,
    'error', SQLERRM
  );
END;
$$;
