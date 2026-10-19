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
  exists(select 1 from public.xtreme_proctors where ieee_id = '90893108' and name = 'Nethravathi S' and capacity = 20),
  'queue #2 Nethravathi S seeded with a 20-squad cap'
);

select ok(
  (select sort_order from public.xtreme_proctors where ieee_id = '102196859')
    < (select sort_order from public.xtreme_proctors where ieee_id = '90893108'),
  'Swaroop BM sorts ahead of Nethravathi S in the fill queue'
);

-- Auto-assign prefers queue order over creation order
select ok(
  (select position('order by p.sort_order' in lower(pg_get_functiondef(oid))) > 0
   from pg_proc where proname = 'auto_assign_proctor' limit 1),
  'auto_assign_proctor fills in sort_order sequence'
);

select * from finish();
rollback;
