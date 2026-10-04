begin;
select plan(8);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'membership_config' and column_name = 'pg_base_fee'),
  'membership config carries a PG base fee'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'chapters' and column_name = 'pg_price'),
  'chapters carry a PG price'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'orders' and column_name = 'program' and column_default = '''UG''::text'),
  'orders carry a program column defaulting to UG'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'profiles' and column_name = 'program' and column_default = '''UG''::text'),
  'profiles carry a program column defaulting to UG'
);

select ok(
  exists(select 1 from information_schema.columns where table_schema = 'public' and table_name = 'checkout_intents' and column_name = 'program' and column_default = '''UG''::text'),
  'checkout intents carry a program column defaulting to UG'
);

select ok(
  has_column_privilege('authenticated', 'public.orders', 'program', 'SELECT'),
  'members can read the program on their own orders'
);

select ok(
  has_function_privilege('service_role', 'public.create_checkout_intent(uuid,uuid[],text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.create_checkout_intent(uuid,uuid[],text)', 'EXECUTE'),
  'only the server role can price checkout intents with a program'
);

select ok(
  has_function_privilege('service_role', 'public.submit_checkout_intent(uuid,uuid,text,text,text,text)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.submit_checkout_intent(uuid,uuid,text,text,text,text)', 'EXECUTE'),
  'only the server role can submit checkout intents with a payment method'
);

select * from finish();
rollback;
