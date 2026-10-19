-- Migration: 20261019120000_xtreme_proctors_and_ownership.sql
-- IEEEXtreme Proctors, Unclaimed Organizer Teams, and Capacity Enforcement

-- 1. Managed Proctors Table
CREATE TABLE IF NOT EXISTS public.xtreme_proctors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  ieee_id text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS xtreme_proctors_ieee_id_idx ON public.xtreme_proctors (ieee_id);

ALTER TABLE public.xtreme_proctors ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON public.xtreme_proctors TO authenticated;

DROP POLICY IF EXISTS "authenticated read xtreme proctors" ON public.xtreme_proctors;
CREATE POLICY "authenticated read xtreme proctors" ON public.xtreme_proctors
  FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "admins manage xtreme proctors" ON public.xtreme_proctors;
CREATE POLICY "admins manage xtreme proctors" ON public.xtreme_proctors
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 2. Alter xtreme_teams table
-- Allow nullable lead_user_id for organizer-created teams before account creation
ALTER TABLE public.xtreme_teams
  ALTER COLUMN lead_user_id DROP NOT NULL;

ALTER TABLE public.xtreme_teams
  ADD COLUMN IF NOT EXISTS leader_email text;

ALTER TABLE public.xtreme_teams
  ADD COLUMN IF NOT EXISTS proctor_id uuid REFERENCES public.xtreme_proctors(id) ON DELETE SET NULL;

-- Replace UNIQUE (lead_user_id) constraint with a partial unique index
ALTER TABLE public.xtreme_teams
  DROP CONSTRAINT IF EXISTS xtreme_teams_lead_unique;

CREATE UNIQUE INDEX IF NOT EXISTS xtreme_teams_lead_user_id_unique
  ON public.xtreme_teams (lead_user_id)
  WHERE lead_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS xtreme_teams_leader_email_ci_idx
  ON public.xtreme_teams (lower(leader_email));

CREATE INDEX IF NOT EXISTS xtreme_teams_proctor_id_idx
  ON public.xtreme_teams (proctor_id);

CREATE INDEX IF NOT EXISTS xtreme_teams_proctor_ieee_id_idx
  ON public.xtreme_teams (proctor_ieee_id);

-- Update RLS policies for xtreme_teams and xtreme_members
DROP POLICY IF EXISTS "leads read own team" ON public.xtreme_teams;
CREATE POLICY "leads read own team" ON public.xtreme_teams
  FOR SELECT TO authenticated
  USING (
    lead_user_id = auth.uid()
    OR (lead_user_id IS NULL AND leader_email IS NOT NULL AND lower(leader_email) = lower(auth.email()))
  );

DROP POLICY IF EXISTS "admins manage xtreme teams" ON public.xtreme_teams;
CREATE POLICY "admins manage xtreme teams" ON public.xtreme_teams
  FOR ALL TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "leads read own team members" ON public.xtreme_members;
CREATE POLICY "leads read own team members" ON public.xtreme_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.xtreme_teams t
    WHERE t.id = team_id AND (
      t.lead_user_id = auth.uid()
      OR (t.lead_user_id IS NULL AND t.leader_email IS NOT NULL AND lower(t.leader_email) = lower(auth.email()))
    )
  ));

DROP POLICY IF EXISTS "admins manage xtreme members" ON public.xtreme_members;
CREATE POLICY "admins manage xtreme members" ON public.xtreme_members
  FOR ALL TO authenticated
  USING (public.is_admin());

-- 3. Concurrency-Safe Proctor Assignment RPC (Max 20 teams per Proctor IEEE ID)
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

  -- Count existing teams assigned to this proctor by IEEE ID (stable identity)
  SELECT count(*) INTO v_current_count
  FROM public.xtreme_teams
  WHERE (proctor_id = v_proctor.id OR proctor_ieee_id = v_proctor.ieee_id)
    AND id <> p_team_id;

  IF v_current_count >= 20 THEN
    RAISE EXCEPTION 'Proctor "%" (%) already has 20 teams assigned.', v_proctor.name, v_proctor.ieee_id;
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
    'assigned_count', v_current_count + 1
  );
END;
$$;

-- 4. Auto-Assign Proctor RPC (Sequential fill-first ordering by created_at)
CREATE OR REPLACE FUNCTION public.auto_assign_proctor(
  p_team_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_proctor_record RECORD;
  v_proctor_id uuid;
  v_assigned_res jsonb;
BEGIN
  -- Find the first proctor by created_at that currently has < 20 teams
  FOR v_proctor_record IN
    SELECT p.id, p.name, p.ieee_id, count(DISTINCT t.id) as team_count
    FROM public.xtreme_proctors p
    LEFT JOIN public.xtreme_teams t
      ON (t.proctor_id = p.id OR t.proctor_ieee_id = p.ieee_id)
    GROUP BY p.id, p.name, p.ieee_id, p.created_at
    HAVING count(DISTINCT t.id) < 20
    ORDER BY p.created_at ASC, p.id ASC
  LOOP
    v_proctor_id := v_proctor_record.id;
    EXIT;
  END LOOP;

  IF v_proctor_id IS NULL THEN
    -- No proctor available with capacity < 20; leave team unassigned
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

-- 5. Auto-Claim Team RPC (Claims unlinked team when user signs in with matching verified email)
CREATE OR REPLACE FUNCTION public.claim_xtreme_team(
  p_user_id uuid,
  p_email text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team_id uuid;
  v_team_name text;
  v_existing_team_id uuid;
BEGIN
  -- Authorization check: caller must be service_role, the target user, or an admin
  IF coalesce(auth.role(), '') <> 'service_role'
     AND current_setting('role', true) NOT IN ('postgres', 'service_role')
     AND (auth.uid() IS NULL OR (auth.uid() <> p_user_id AND NOT public.is_admin())) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'Email is required.');
  END IF;

  -- Check if user already owns a team
  SELECT id INTO v_existing_team_id
  FROM public.xtreme_teams
  WHERE lead_user_id = p_user_id
  LIMIT 1;

  IF v_existing_team_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'claimed', false,
      'already_has_team', true,
      'team_id', v_existing_team_id
    );
  END IF;

  -- Find matching unclaimed team
  SELECT id, team_name INTO v_team_id, v_team_name
  FROM public.xtreme_teams
  WHERE lead_user_id IS NULL
    AND leader_email IS NOT NULL
    AND lower(leader_email) = lower(trim(p_email))
  LIMIT 1
  FOR UPDATE;

  IF v_team_id IS NULL THEN
    RETURN jsonb_build_object('claimed', false, 'reason', 'No unclaimed team found matching email.');
  END IF;

  -- Link user as lead
  UPDATE public.xtreme_teams
  SET lead_user_id = p_user_id,
      updated_at = now()
  WHERE id = v_team_id;

  RETURN jsonb_build_object(
    'claimed', true,
    'team_id', v_team_id,
    'team_name', v_team_name
  );
END;
$$;

-- 6. Update save_xtreme_team to record leader_email
CREATE OR REPLACE FUNCTION public.save_xtreme_team(
  p_team_name text,
  p_lead_user_id uuid,
  p_members jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_team_id uuid;
  v_existing_id uuid;
  v_vtools_verified boolean;
  v_member jsonb;
  v_lead_email text;
BEGIN
  -- Authorization check: caller must be service_role, the team lead, or an admin
  IF coalesce(auth.role(), '') <> 'service_role'
     AND current_setting('role', true) NOT IN ('postgres', 'service_role')
     AND (auth.uid() IS NULL OR (p_lead_user_id IS NOT NULL AND auth.uid() <> p_lead_user_id AND NOT public.is_admin())) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Find lead email from members
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    IF (v_member->>'is_lead')::boolean IS TRUE THEN
      v_lead_email := lower(trim(v_member->>'email'));
      EXIT;
    END IF;
  END LOOP;

  -- Check if team exists for this lead (if lead_user_id is provided)
  IF p_lead_user_id IS NOT NULL THEN
    SELECT id, vtools_verified INTO v_existing_id, v_vtools_verified
    FROM public.xtreme_teams
    WHERE lead_user_id = p_lead_user_id;

    IF v_vtools_verified IS TRUE THEN
      RAISE EXCEPTION 'Registration is locked because official vTools registration has been confirmed.';
    END IF;
  END IF;

  -- Check if team name is taken by another team
  IF EXISTS (
    SELECT 1 FROM public.xtreme_teams
    WHERE lower(team_name) = lower(p_team_name)
      AND (v_existing_id IS NULL OR id <> v_existing_id)
  ) THEN
    RAISE EXCEPTION 'Team name is already taken.';
  END IF;

  -- Upsert team
  IF v_existing_id IS NOT NULL THEN
    v_team_id := v_existing_id;
    UPDATE public.xtreme_teams
    SET team_name = p_team_name,
        leader_email = COALESCE(v_lead_email, leader_email),
        updated_at = now()
    WHERE id = v_team_id;

    -- Delete old members
    DELETE FROM public.xtreme_members WHERE team_id = v_team_id;
  ELSE
    INSERT INTO public.xtreme_teams (team_name, lead_user_id, leader_email, vtools_verified)
    VALUES (p_team_name, p_lead_user_id, v_lead_email, false)
    RETURNING id INTO v_team_id;
  END IF;

  -- Insert members atomically
  FOR v_member IN SELECT * FROM jsonb_array_elements(p_members)
  LOOP
    INSERT INTO public.xtreme_members (
      team_id,
      is_lead,
      ieee_member_id,
      first_name,
      last_name,
      email,
      phone,
      usn,
      department,
      year_of_study
    ) VALUES (
      v_team_id,
      (v_member->>'is_lead')::boolean,
      v_member->>'ieee_member_id',
      v_member->>'first_name',
      COALESCE(v_member->>'last_name', ''),
      lower(trim(v_member->>'email')),
      v_member->>'phone',
      upper(COALESCE(v_member->>'usn', '')),
      v_member->>'department',
      v_member->>'year_of_study'
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'team_id', v_team_id, 'team_name', p_team_name);
END;
$$;

