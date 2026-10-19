-- ==============================================================================
-- BMSCE IEEE — Consolidated Supabase Migration (19 Oct 2026)
-- Apply this file in the Supabase SQL Editor.
-- Safe to re-run: all statements are idempotent.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- Part 1: Support SAC admin role & dynamic role sync (20261019140000)
-- ==============================================================================

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
    select u.id, coalesce(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)), coalesce(new.role, 'admin')
    from auth.users u where lower(u.email) = lower(new.email)
    on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;

  return new;
end;
$$;
revoke all on function public.sync_admin_from_whitelist() from public, anon, authenticated;

create or replace function public.provision_admin_for_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  select role into v_role from public.admin_whitelist w where lower(w.email) = lower(new.email);
  if v_role is not null then
    insert into public.admins (id, full_name, role)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(v_role, 'admin'))
    on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
  end if;
  return new;
end;
$$;
revoke all on function public.provision_admin_for_auth_user() from public, anon, authenticated;

create or replace function public.sync_admin_email_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_role text;
begin
  if lower(coalesce(old.email, '')) <> lower(coalesce(new.email, '')) then
    select role into v_role from public.admin_whitelist w where lower(w.email) = lower(new.email);
    if v_role is not null then
      insert into public.admins (id, full_name, role)
      values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), coalesce(v_role, 'admin'))
      on conflict (id) do update set full_name = excluded.full_name, role = excluded.role;
    else
      delete from public.admins where id = new.id;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.sync_admin_email_change() from public, anon, authenticated;

update public.admins a
set role = w.role
from auth.users u
join public.admin_whitelist w on lower(w.email) = lower(u.email)
where a.id = u.id and coalesce(a.role, '') <> coalesce(w.role, '');

insert into public.admin_whitelist (email, role)
values
  ('shreyamurali.ec25@bmsce.ac.in', 'sac'),
  ('mirzaareeb.ec25@bmsce.ac.in', 'sac'),
  ('manasaprabhu.ai25@bmsce.ac.in', 'sac'),
  ('niharikachauhan.bs25@bmsce.ac.in', 'sac'),
  ('sahanadesai.bs25@bmsce.ac.in', 'sac'),
  ('soundaryaprashanthrao.cs25@bmsce.ac.in', 'sac'),
  ('sahanaganesh.cs25@bmsce.ac.in', 'sac'),
  ('lakinanadeepak.cs25@bmsce.ac.in', 'sac'),
  ('thrisha.cd25@bmsce.ac.in', 'sac'),
  ('sharathchandras.ec25@bmsce.ac.in', 'sac'),
  ('srujangv.ec25@bmsce.ac.in', 'sac'),
  ('thanishashree.cs25@bmsce.ac.in', 'sac'),
  ('vedavansika.me25@bmsce.ac.in', 'sac')
on conflict (email) do update set role = excluded.role;


-- ==============================================================================
-- Part 2: Admins update profiles policy & harden SAC RLS (20261019150000 / 20261019160000)
-- ==============================================================================

create or replace function public.is_privileged_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.admins
    where id = (select auth.uid())
      and lower(coalesce(role, 'admin')) <> 'sac'
  );
$$;
revoke all on function public.is_privileged_admin() from public, anon;
grant execute on function public.is_privileged_admin() to authenticated;

drop policy if exists "admins manage chapters" on public.chapters;
create policy "admins manage chapters" on public.chapters
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins manage config" on public.membership_config;
create policy "admins manage config" on public.membership_config
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins manage announcement" on public.announcement;
create policy "admins manage announcement" on public.announcement
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins manage events" on public.events;
create policy "admins manage events" on public.events
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins manage admins" on public.admins;
create policy "admins manage admins" on public.admins
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins manage whitelist" on public.admin_whitelist;
create policy "admins manage whitelist" on public.admin_whitelist
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles
  for update to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

drop policy if exists "admins write activity" on public.admin_activity;
create policy "admins write activity" on public.admin_activity
  for insert to authenticated
  with check (is_privileged_admin());


-- ==============================================================================
-- Part 3: Sequential Proctor Queue with Per-Proctor Squad Caps (20261019170000)
-- ==============================================================================

ALTER TABLE public.xtreme_proctors
  ADD COLUMN IF NOT EXISTS capacity int NOT NULL DEFAULT 20
    CHECK (capacity > 0 AND capacity <= 500);
ALTER TABLE public.xtreme_proctors
  ADD COLUMN IF NOT EXISTS sort_order int NOT NULL DEFAULT 0;

UPDATE public.xtreme_teams
SET proctor_id = NULL,
    proctor_name = NULL,
    proctor_ieee_id = NULL,
    updated_at = now()
WHERE proctor_ieee_id IN ('90451234', '90455678');

DELETE FROM public.xtreme_proctors
WHERE ieee_id IN ('90451234', '90455678');

WITH ranked AS (
  SELECT id, (row_number() OVER (ORDER BY created_at ASC, id ASC)) * 10 AS rn
  FROM public.xtreme_proctors
)
UPDATE public.xtreme_proctors p
SET sort_order = ranked.rn
FROM ranked
WHERE p.id = ranked.id AND p.sort_order = 0;

INSERT INTO public.xtreme_proctors (name, ieee_id, capacity, sort_order)
VALUES
  ('Swaroop BM', '102196859', 15, 10),
  ('Nethravathi S', '90893108', 20, 20)
ON CONFLICT (ieee_id) DO UPDATE SET
  name = excluded.name,
  capacity = excluded.capacity,
  sort_order = excluded.sort_order;

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
  IF coalesce(auth.role(), '') <> 'service_role'
     AND current_setting('role', true) NOT IN ('postgres', 'service_role')
     AND (auth.uid() IS NULL OR NOT public.is_admin()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT EXISTS (SELECT 1 FROM public.xtreme_teams WHERE id = p_team_id) INTO v_team_exists;
  IF NOT v_team_exists THEN
    RAISE EXCEPTION 'Team not found.';
  END IF;

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

  SELECT * INTO v_proctor
  FROM public.xtreme_proctors
  WHERE id = p_proctor_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proctor not found.';
  END IF;

  v_cap := coalesce(v_proctor.capacity, 20);

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
  SELECT p.id INTO v_proctor_id
  FROM public.xtreme_proctors p
  LEFT JOIN public.xtreme_teams t
    ON (t.proctor_id = p.id OR t.proctor_ieee_id = p.ieee_id)
  GROUP BY p.id, p.sort_order, p.created_at
  HAVING count(DISTINCT t.id) < coalesce(max(p.capacity), 20)
  ORDER BY p.sort_order ASC, p.created_at ASC, p.id ASC
  LIMIT 1;

  IF v_proctor_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'assigned', false,
      'reason', 'No proctor available with remaining capacity.'
    );
  END IF;

  v_assigned_res := public.assign_proctor_to_team(p_team_id, v_proctor_id);
  RETURN jsonb_build_object(
    'success', true,
    'assigned', true,
    'assignment', v_assigned_res
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'assigned', false,
    'error', SQLERRM
  );
END;
$$;

COMMIT;
