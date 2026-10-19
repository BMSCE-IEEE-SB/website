begin;
select plan(7);

-- Queue columns exist
select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'xtreme_proctors' and column_name = 'capacity'),
  'xtreme_proctors carries a capacity column'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'xtreme_proctors' and column_name = 'sort_order'),
  'xtreme_proctors carries a sort_order column'
);

-- Old sample proctors removed
select ok(
  not exists(select 1 from public.xtreme_proctors where ieee_id in ('90451234', '90455678')),
  'old sample proctors (90451234, 90455678) are removed'
);

-- Live queue seeds
select ok(
  exists(select 1 from public.xtreme_proctors where ieee_id = '102196859' and name = 'Swaroop BM' and capacity = 15),
  'queue #1 Swaroop BM seeded with a 15-squad cap'
);

select ok(
  exists(select 1 from public.xtreme_proctors where ieee_id = '90893108' and capacity = 15),
  'queue #2 Nethravathi S seeded with a 15-squad cap'
);

select ok(
  exists(select 1 from public.xtreme_proctors where ieee_id = '90557111' and capacity = 15),
  'queue #3 D N Sujatha seeded with a 15-squad cap'
);

-- Auto-assign uses balanced randomized distribution
select ok(
  (select position('random()' in lower(pg_get_functiondef(oid))) > 0
   from pg_proc where proname = 'auto_assign_proctor' limit 1),
  'auto_assign_proctor uses randomized balanced assignment'
);

select * from finish();
rollback;
