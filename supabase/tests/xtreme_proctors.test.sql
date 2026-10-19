begin;
select plan(7);

-- 1. xtreme_proctors table structure
select ok(
  exists(select 1 from information_schema.tables where table_schema = 'public' and table_name = 'xtreme_proctors'),
  'xtreme_proctors table exists'
);

-- 2. xtreme_teams nullable lead_user_id and new columns
select ok(
  exists(
    select 1 from information_schema.columns 
    where table_schema = 'public' 
      and table_name = 'xtreme_teams' 
      and column_name = 'lead_user_id' 
      and is_nullable = 'YES'
  ),
  'xtreme_teams.lead_user_id is nullable for unclaimed organizer teams'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'xtreme_teams' and column_name = 'leader_email'),
  'xtreme_teams carries a leader_email column for verified sign-in matching'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'xtreme_teams' and column_name = 'proctor_id'),
  'xtreme_teams carries a proctor_id foreign key column'
);

-- 3. Functions exist
select ok(
  has_function_privilege('authenticated', 'public.assign_proctor_to_team(uuid,uuid)', 'EXECUTE'),
  'assign_proctor_to_team function exists and is callable'
);

select ok(
  has_function_privilege('authenticated', 'public.auto_assign_proctor(uuid)', 'EXECUTE'),
  'auto_assign_proctor function exists and is callable'
);

select ok(
  has_function_privilege('authenticated', 'public.claim_xtreme_team(uuid,text)', 'EXECUTE'),
  'claim_xtreme_team function exists and is callable'
);

select * from finish();
rollback;

