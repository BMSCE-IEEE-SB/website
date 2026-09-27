begin;
select plan(8);

select ok(
  not has_table_privilege('anon', 'public.checkout_intents', 'SELECT'),
  'anonymous clients cannot inspect checkout intents'
);
select ok(
  not has_table_privilege('authenticated', 'public.checkout_intents', 'SELECT'),
  'authenticated clients cannot inspect checkout intents directly'
);
select ok(
  has_table_privilege('service_role', 'public.checkout_intents', 'SELECT'),
  'server service role can read owned checkout intents'
);
select ok(
  not has_column_privilege('anon', 'public.membership_config', 'treasurer_phone', 'SELECT'),
  'public clients cannot read private treasurer contact details'
);
select ok(
  not has_table_privilege('authenticated', 'public.orders', 'INSERT'),
  'members cannot forge orders through direct table inserts'
);
select ok(
  not has_table_privilege('authenticated', 'public.admin_whitelist', 'DELETE'),
  'members cannot revoke or grant administrators directly'
);
select ok(
  has_function_privilege('service_role', 'public.reserve_order_receipt(uuid,uuid)', 'EXECUTE')
  and not has_function_privilege('authenticated', 'public.reserve_order_receipt(uuid,uuid)', 'EXECUTE'),
  'only the server role can reserve official order receipts'
);

select set_config('request.jwt.claim.role', 'authenticated', true);
select throws_ok(
  $$select public.create_checkout_intent('00000000-0000-4000-8000-000000000001'::uuid, '{}'::uuid[])$$,
  'P0001', 'forbidden', 'checkout pricing RPC rejects non-service callers'
);

select * from finish();
rollback;
