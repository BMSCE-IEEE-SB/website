-- IEEEXtreme 20.0 Registration Tables

-- 1. Known members (legacy CSV upload + active BMSCE IEEE members)
CREATE TABLE IF NOT EXISTS public.ieee_member_2026 (
  ieee_member_id text PRIMARY KEY,
  name text,
  email text,
  source text NOT NULL DEFAULT 'legacy_upload',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Teams
CREATE TABLE IF NOT EXISTS public.xtreme_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name text NOT NULL,
  lead_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vtools_verified boolean NOT NULL DEFAULT false,
  proctor_name text,
  proctor_ieee_id text,
  admin_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xtreme_teams_lead_unique UNIQUE (lead_user_id),
  CONSTRAINT xtreme_teams_name_format CHECK (
    length(team_name) >= 3 AND
    length(team_name) <= 20 AND
    team_name ~ '^[a-zA-Z0-9]+$'
  )
);

CREATE UNIQUE INDEX IF NOT EXISTS xtreme_teams_name_ci_idx ON public.xtreme_teams (lower(team_name));

-- 3. Team Members
CREATE TABLE IF NOT EXISTS public.xtreme_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.xtreme_teams(id) ON DELETE CASCADE,
  is_lead boolean NOT NULL DEFAULT false,
  ieee_member_id text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL DEFAULT '',
  email text NOT NULL,
  phone text,
  usn text,
  department text,
  year_of_study text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT xtreme_members_ieee_unique UNIQUE (ieee_member_id)
);

CREATE INDEX IF NOT EXISTS xtreme_members_team_id_idx ON public.xtreme_members(team_id);

-- Enable RLS
ALTER TABLE public.ieee_member_2026 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xtreme_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.xtreme_members ENABLE ROW LEVEL SECURITY;

-- Grants
GRANT SELECT ON public.xtreme_teams, public.xtreme_members TO authenticated;
GRANT SELECT ON public.ieee_member_2026 TO authenticated;

-- Policies
DROP POLICY IF EXISTS "leads read own team" ON public.xtreme_teams;
CREATE POLICY "leads read own team" ON public.xtreme_teams
  FOR SELECT TO authenticated
  USING (lead_user_id = auth.uid());

DROP POLICY IF EXISTS "admins read all xtreme teams" ON public.xtreme_teams;
CREATE POLICY "admins read all xtreme teams" ON public.xtreme_teams
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "leads read own team members" ON public.xtreme_members;
CREATE POLICY "leads read own team members" ON public.xtreme_members
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.xtreme_teams t
    WHERE t.id = team_id AND t.lead_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "admins read all xtreme members" ON public.xtreme_members;
CREATE POLICY "admins read all xtreme members" ON public.xtreme_members
  FOR SELECT TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "admins read all known members" ON public.ieee_member_2026;
CREATE POLICY "admins read all known members" ON public.ieee_member_2026
  FOR SELECT TO authenticated
  USING (public.is_admin());

-- 4. Atomic Team & Roster Save RPC
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
BEGIN
  -- Authorization check: caller must be the team lead or an admin
  IF auth.uid() IS NULL OR (auth.uid() <> p_lead_user_id AND NOT public.is_admin()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  -- Check if team exists for this lead
  SELECT id, vtools_verified INTO v_existing_id, v_vtools_verified
  FROM public.xtreme_teams
  WHERE lead_user_id = p_lead_user_id;

  IF v_vtools_verified IS TRUE THEN
    RAISE EXCEPTION 'Registration is locked because official vTools registration has been confirmed.';
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
        updated_at = now()
    WHERE id = v_team_id;

    -- Delete old members
    DELETE FROM public.xtreme_members WHERE team_id = v_team_id;
  ELSE
    INSERT INTO public.xtreme_teams (team_name, lead_user_id, vtools_verified)
    VALUES (p_team_name, p_lead_user_id, false)
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
      lower(v_member->>'email'),
      v_member->>'phone',
      upper(COALESCE(v_member->>'usn', '')),
      v_member->>'department',
      v_member->>'year_of_study'
    );
  END LOOP;

  RETURN jsonb_build_object('success', true, 'team_id', v_team_id, 'team_name', p_team_name);
END;
$$;
