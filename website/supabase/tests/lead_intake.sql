-- TESTS ONLY: this is NOT the initial Supabase project setup query.
-- For setup use supabase/migrations/202610260001_lead_intake.sql instead.
-- Run after the migration as the database owner against a disposable test DB.
-- Every test change is rolled back; no fixture contains a real customer's data.
do $test_guard$
begin
  if pg_catalog.current_setting('luxe.disposable_tests', true) is distinct from 'true' then
    raise exception 'TESTS ONLY. For setup, run supabase/migrations/202610260001_lead_intake.sql in a new query.';
  end if;
end;
$test_guard$;
begin;

do $test$
declare
  v_role text;
  v_table text;
  v_rpc text;
  v_count bigint;
  v_proc pg_catalog.pg_proc%rowtype;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    if pg_catalog.has_schema_privilege(v_role, 'luxe_private', 'USAGE') then
      raise exception '% can access the private schema', v_role;
    end if;
    foreach v_table in array array['leads', 'rate_events'] loop
      if pg_catalog.has_table_privilege(v_role, 'luxe_private.' || v_table, 'SELECT,INSERT,UPDATE,DELETE') then
        raise exception '% can access private %', v_role, v_table;
      end if;
    end loop;
  end loop;
  foreach v_rpc in array array[
    'public.luxe_submit_enquiry(uuid,text,text,text,text,text,text,text,text,text)',
    'public.luxe_lead_readiness()'
  ] loop
    foreach v_role in array array['anon', 'authenticated'] loop
      if pg_catalog.has_function_privilege(v_role, v_rpc, 'EXECUTE') then
        raise exception '% can execute %', v_role, v_rpc;
      end if;
    end loop;
    if not pg_catalog.has_function_privilege('service_role', v_rpc, 'EXECUTE') then
      raise exception 'service_role cannot execute %', v_rpc;
    end if;
    select * into v_proc from pg_catalog.pg_proc where oid = v_rpc::regprocedure;
    if not v_proc.prosecdef or not ('search_path=""' = any(v_proc.proconfig)) then
      raise exception 'RPC must use SECURITY DEFINER with an empty search_path';
    end if;
  end loop;
  select pg_catalog.count(*) into v_count from pg_catalog.pg_class c
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'luxe_private' and c.relname in ('leads', 'rate_events')
      and c.relrowsecurity;
  if v_count <> 2 then raise exception 'Private tables require RLS'; end if;
end;
$test$;

set local role anon;
do $test$
begin
  begin
    perform public.luxe_lead_readiness();
    raise exception 'anon unexpectedly executed readiness';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
reset role;

set local role service_role;
do $test$
declare
  v_id uuid := '11111111-1111-4111-8111-111111111111';
  v_first jsonb;
  v_repeat jsonb;
begin
  begin
    perform 1 from luxe_private.leads;
    raise exception 'service_role unexpectedly read private leads directly';
  exception when insufficient_privilege then null;
  end;
  if public.luxe_lead_readiness() <> '{"schemaVersion":"1"}'::jsonb then
    raise exception 'Unexpected readiness response';
  end if;
  v_first := public.luxe_submit_enquiry(v_id, repeat('a', 64), 'quote',
    'Test Enquiry', '+919000000001', 'Test City', 'Disposable SQL test.',
    'https://luxeinfra.in', repeat('b', 64), repeat('c', 64));
  v_repeat := public.luxe_submit_enquiry(v_id, repeat('a', 64), 'quote',
    'Test Enquiry', '+919000000001', 'Test City', 'Disposable SQL test.',
    'https://luxeinfra.in', repeat('b', 64), repeat('c', 64));
  if v_first->>'reference' !~ '^LX-[0-9]{8}-[0-9A-F]{12}$'
    or (v_first->>'duplicate')::boolean
    or not (v_repeat->>'duplicate')::boolean
    or (v_first - 'duplicate') <> (v_repeat - 'duplicate')
    or (select count(*) from jsonb_object_keys(v_first)) <> 3 then
    raise exception 'Invalid or non-idempotent receipt';
  end if;
  begin
    perform public.luxe_submit_enquiry(v_id, repeat('d', 64), 'quote',
      'Test Enquiry', '+919000000001', 'Test City', 'Changed payload.',
      'https://luxeinfra.in', repeat('b', 64), repeat('c', 64));
    raise exception 'Changed fingerprint was accepted';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.luxe_submit_enquiry(gen_random_uuid(), repeat('a', 64), 'quote',
      'Test Enquiry', '+919000000001', 'Test City', 'Disposable SQL test.',
      'http://luxeinfra.in', repeat('b', 64), repeat('c', 64));
    raise exception 'Insecure origin was accepted';
  exception when sqlstate 'PT400' then null;
  end;
end;
$test$;
reset role;

do $test$
declare
  v_lead luxe_private.leads%rowtype;
begin
  select * into v_lead from luxe_private.leads
    where id = '11111111-1111-4111-8111-111111111111';
  if v_lead.consent is not true or v_lead.consent_version <> '2026-10-26'
    or v_lead.status <> 'new' or v_lead.notification_status <> 'not_configured' then
    raise exception 'Consent or initial state was not recorded';
  end if;
  if (select count(*) from luxe_private.rate_events
      where enquiry_id = v_lead.id) <> 3 then
    raise exception 'A duplicate consumed additional rate allowance';
  end if;
end;
$test$;

-- Use nested blocks so synthetic counter fixtures are rolled back independently.
do $test$
declare
  v_scope text;
  v_limit integer;
  v_hash text;
  v_now timestamptz := clock_timestamp();
begin
  foreach v_scope in array array['ip', 'phone', 'global'] loop
    begin
      v_limit := case v_scope when 'ip' then 12 when 'phone' then 5 else 500 end;
      v_hash := case v_scope when 'ip' then repeat('e', 64)
        when 'phone' then repeat('f', 64) else repeat('0', 64) end;
      -- The existing test enquiry has one global event; fixtures fill the rest.
      insert into luxe_private.leads (id, fingerprint, reference, kind, name,
        phone, city, message, origin, ip_hash, phone_hash)
      select ('22222222-2222-4222-8222-' || lpad(i::text, 12, '0'))::uuid,
        repeat('a', 64), 'LX-20000101-' || upper(lpad(to_hex(i), 12, '0')),
        'quote', 'Rate Fixture', '+919000000002', 'Test City', 'Quota test.',
        'https://luxeinfra.in', repeat('e', 64), repeat('f', 64)
      from generate_series(1, v_limit - case when v_scope = 'global' then 1 else 0 end) i;
      insert into luxe_private.rate_events (scope, subject_hash, enquiry_id, occurred_at)
      select v_scope, v_hash, id, v_now from luxe_private.leads
        where id::text like '22222222-2222-4222-8222-%';
      begin
        perform public.luxe_submit_enquiry(gen_random_uuid(), repeat('a', 64),
          'quote', 'Rate Enquiry', '+919000000002', 'Test City', 'Quota test.',
          'https://luxeinfra.in', repeat('e', 64), repeat('f', 64));
        raise exception '% quota did not block a request', v_scope;
      exception when sqlstate 'PT429' then null;
      end;
      -- Replaying an accepted request still succeeds when a quota is full.
      if not (public.luxe_submit_enquiry(
        '11111111-1111-4111-8111-111111111111', repeat('a', 64), 'quote',
        'Test Enquiry', '+919000000001', 'Test City', 'Disposable SQL test.',
        'https://luxeinfra.in', repeat('b', 64), repeat('c', 64))->>'duplicate')::boolean then
        raise exception 'Quota blocked a duplicate';
      end if;
      raise sqlstate 'TST01';
    exception when sqlstate 'TST01' then null;
    end;
  end loop;
end;
$test$;

-- Capacity fails closed, while a previously accepted receipt remains usable.
do $test$
begin
  begin
    insert into luxe_private.leads (id, fingerprint, reference, kind, name,
      phone, city, message, origin, ip_hash, phone_hash)
    select ('33333333-3333-4333-8333-' || lpad(i::text, 12, '0'))::uuid,
      repeat('a', 64), 'LX-20000102-' || upper(lpad(to_hex(i), 12, '0')),
      'partner', 'Capacity Fixture', '+919000000003', 'Test City', 'Capacity test.',
      'https://luxeinfra.in', repeat('d', 64), repeat('e', 64)
    from generate_series(1, 9999) i;
    begin
      perform public.luxe_submit_enquiry(gen_random_uuid(), repeat('a', 64),
        'partner', 'Capacity Enquiry', '+919000000003', 'Test City', 'Capacity test.',
        'https://luxeinfra.in', repeat('d', 64), repeat('e', 64));
      raise exception 'Capacity did not block a request';
    exception when sqlstate 'PT503' then null;
    end;
    if not (public.luxe_submit_enquiry(
      '11111111-1111-4111-8111-111111111111', repeat('a', 64), 'quote',
      'Test Enquiry', '+919000000001', 'Test City', 'Disposable SQL test.',
      'https://luxeinfra.in', repeat('b', 64), repeat('c', 64))->>'duplicate')::boolean then
      raise exception 'Capacity blocked a duplicate';
    end if;
    raise sqlstate 'TST02';
  exception when sqlstate 'TST02' then null;
  end;
end;
$test$;

do $test$
declare
  v_id uuid;
begin
  begin
    insert into luxe_private.leads (id, fingerprint, reference, kind, name,
      phone, city, message, origin, ip_hash, phone_hash)
    select ('44444444-4444-4444-8444-' || lpad(i::text, 12, '0'))::uuid,
      repeat('a', 64), 'LX-20000103-' || upper(lpad(to_hex(i), 12, '0')),
      'quote', 'Expired Fixture', '+919000000004', 'Test City', 'Expiry test.',
      'https://luxeinfra.in', repeat('e', 64), repeat('f', 64)
    from generate_series(1, 12) i;
    insert into luxe_private.rate_events (scope, subject_hash, enquiry_id, occurred_at)
    select 'ip', repeat('e', 64), id, clock_timestamp() - interval '11 minutes'
    from luxe_private.leads where id::text like '44444444-4444-4444-8444-%';
    insert into luxe_private.rate_events (scope, subject_hash, enquiry_id, occurred_at)
    select 'phone', repeat('f', 64), id, clock_timestamp() - interval '61 minutes'
    from luxe_private.leads where id::text like '44444444-4444-4444-8444-%';
    -- This daily event has expired and must be pruned without deleting its lead.
    insert into luxe_private.rate_events (scope, subject_hash, enquiry_id, occurred_at)
    values ('global', repeat('0', 64), '44444444-4444-4444-8444-000000000001',
      clock_timestamp() - interval '2 days');
    v_id := gen_random_uuid();
    perform public.luxe_submit_enquiry(v_id, repeat('a', 64), 'quote',
      'Expiry Enquiry', '+919000000004', 'Test City', 'Expiry test.',
      'https://luxeinfra.in', repeat('e', 64), repeat('f', 64));
    if exists (select 1 from luxe_private.rate_events
        where occurred_at < clock_timestamp() - interval '1 day')
      or not exists (select 1 from luxe_private.leads
        where id = '44444444-4444-4444-8444-000000000001') then
      raise exception 'Expired counters were not pruned safely';
    end if;
    update luxe_private.leads set status = 'contacted',
      updated_at = '2000-01-01T00:00:00Z' where id = v_id;
    if not exists (select 1 from luxe_private.leads where id = v_id
        and status = 'contacted' and updated_at > created_at) then
      raise exception 'Status updates did not refresh their timestamp';
    end if;
    raise sqlstate 'TST03';
  exception when sqlstate 'TST03' then null;
  end;
end;
$test$;

rollback;
