begin;
select plan(12);

select ok(
  exists(select 1 from pg_proc where proname = 'is_privileged_admin'),
  'is_privileged_admin() function exists'
);

-- Modification policies on membership/fee/admin tables must use the
-- privileged predicate (SAC cannot write directly, bypassing the API).
select ok(
  (select count(*) from pg_policies
    where schemaname = 'public'
      and policyname in (
        'admins manage chapters', 'admins manage config',
        'admins manage announcement', 'admins manage events',
        'admins manage admins', 'admins manage whitelist',
        'admins update profiles', 'admins manage orders',
        'admins write activity'
      )
      and (qual ilike '%is_privileged_admin()%' or with_check ilike '%is_privileged_admin()%')
  ) = 9,
  'all 9 membership/fee/admin modification policies require privileged admin'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'admins'
    and policyname = 'admins manage admins' and qual ilike '%is_privileged_admin()%'),
  'admins table cannot be modified directly by SAC'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_whitelist'
    and policyname = 'admins manage whitelist' and qual ilike '%is_privileged_admin()%'),
  'admin_whitelist cannot be modified directly by SAC (no self-promotion)'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'orders'
    and policyname = 'admins manage orders' and qual ilike '%is_privileged_admin()%'),
  'orders cannot be modified directly by SAC'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'admins update profiles' and qual ilike '%is_privileged_admin()%'),
  'profiles cannot be updated directly by SAC'
);

-- Reads stay open (SAC keeps read-only portal access).
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'admins read profiles' and qual ilike '%is_admin()%'),
  'SAC keeps read access to profiles'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'admin_whitelist'
    and policyname = 'admins read whitelist' and qual ilike '%is_admin()%'),
  'SAC keeps read access to the whitelist'
);

-- Xtreme stays fully manageable (SAC owns IEEEXtreme operations).
select ok(
  (select count(*) from pg_policies where schemaname = 'public'
    and tablename in ('xtreme_teams', 'xtreme_members', 'xtreme_proctors', 'ieee_member_2026')
    and qual ilike '%is_admin()%') >= 3,
  'xtreme management policies still use role-blind is_admin for SAC'
);

-- Member self-service lanes untouched.
select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'profiles'
    and policyname = 'members manage own profile'),
  'member own-profile policy untouched'
);

select ok(
  exists(select 1 from pg_policies where schemaname = 'public' and tablename = 'orders'
    and policyname = 'members create own orders'),
  'member own-order creation policy untouched'
);

select ok(
  has_function_privilege('authenticated', 'public.is_privileged_admin()', 'execute')
  and not has_function_privilege('anon', 'public.is_privileged_admin()', 'execute'),
  'is_privileged_admin executable by authenticated only'
);

select * from finish();
rollback;
