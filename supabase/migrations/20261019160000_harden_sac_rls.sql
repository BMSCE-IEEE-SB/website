-- Migration: restrict direct (non-API) writes on membership/fee/admin tables
-- to privileged (non-SAC) admins.
--
-- The API layer enforces SAC read-only access via canModifyMembership(), but
-- every RLS management policy below used the role-blind is_admin(). Any SAC
-- JWT could therefore bypass the API and write directly with a Supabase
-- client — including promoting itself via admin_whitelist/admins.
--
-- This migration adds is_privileged_admin() (admin row whose role is not
-- 'sac') and swaps it into the modification policies. Unchanged on purpose:
--   * SELECT policies keep is_admin() — SAC keeps read access everywhere.
--   * xtreme_* management policies keep is_admin() — SAC owns IEEEXtreme.
--   * Member own-row policies are untouched.
-- App mutations go through /api/* with the service_role client (bypasses
-- RLS), so no application flow is affected.

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

-- chapters
drop policy if exists "admins manage chapters" on public.chapters;
create policy "admins manage chapters" on public.chapters
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- membership_config
drop policy if exists "admins manage config" on public.membership_config;
create policy "admins manage config" on public.membership_config
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- announcement
drop policy if exists "admins manage announcement" on public.announcement;
create policy "admins manage announcement" on public.announcement
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- events
drop policy if exists "admins manage events" on public.events;
create policy "admins manage events" on public.events
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- admins
drop policy if exists "admins manage admins" on public.admins;
create policy "admins manage admins" on public.admins
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- admin_whitelist
drop policy if exists "admins manage whitelist" on public.admin_whitelist;
create policy "admins manage whitelist" on public.admin_whitelist
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- profiles (admin update lane; member own-row policy untouched)
drop policy if exists "admins update profiles" on public.profiles;
create policy "admins update profiles" on public.profiles
  for update to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

-- orders (admin lane; member insert/resubmit policies untouched)
drop policy if exists "admins manage orders" on public.orders;
create policy "admins manage orders" on public.orders
  for all to authenticated
  using (is_privileged_admin()) with check (is_privileged_admin());

