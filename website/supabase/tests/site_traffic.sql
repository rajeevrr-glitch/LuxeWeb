-- TESTS ONLY. Never run this file against the live project.
-- Setup is migrations/202610270005_site_traffic.sql, not this disposable test.
do $guard$
begin
  if pg_catalog.current_setting('luxe.disposable_tests', true) is distinct from 'true' then
    raise exception 'TESTS ONLY: use a disposable database and explicitly enable luxe.disposable_tests. For setup run migrations/202610270005_site_traffic.sql.';
  end if;
end;
$guard$;

begin;

do $test$
declare
  v_role text;
  v_table text;
  v_rpc text;
  v_proc pg_catalog.pg_proc%rowtype;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    if pg_catalog.has_schema_privilege(v_role, 'luxe_private', 'USAGE')
      or pg_catalog.has_function_privilege(v_role, 'luxe_private.traffic_pages()', 'EXECUTE') then
      raise exception '% received direct private traffic access', v_role;
    end if;
    foreach v_table in array array['traffic_daily', 'traffic_events', 'traffic_visitors', 'traffic_dimensions'] loop
      if pg_catalog.has_table_privilege(v_role, 'luxe_private.' || v_table, 'SELECT,INSERT,UPDATE,DELETE')
        or not (select relrowsecurity from pg_catalog.pg_class
          where oid = ('luxe_private.' || v_table)::regclass) then
        raise exception 'Traffic table % has unsafe grants or missing RLS', v_table;
      end if;
    end loop;
  end loop;
  foreach v_rpc in array array['public.luxe_traffic_capture(uuid,text,text,text,text,integer)',
    'public.luxe_inbox_traffic(uuid,integer)', 'public.luxe_traffic_readiness()'] loop
    foreach v_role in array array['anon', 'authenticated'] loop
      if pg_catalog.has_function_privilege(v_role, v_rpc, 'EXECUTE') then
        raise exception '% can execute traffic RPC %', v_role, v_rpc;
      end if;
    end loop;
    if not pg_catalog.has_function_privilege('service_role', v_rpc, 'EXECUTE') then
      raise exception 'Server role cannot execute traffic RPC %', v_rpc;
    end if;
    select * into v_proc from pg_catalog.pg_proc where oid = v_rpc::regprocedure;
    if not v_proc.prosecdef or not ('search_path=""' = any(v_proc.proconfig)) then
      raise exception 'Traffic RPC must use SECURITY DEFINER and empty search_path';
    end if;
  end loop;
  if cardinality(luxe_private.traffic_pages()) <> 35
    or '/admin' = any(luxe_private.traffic_pages()) or '/reset-password' = any(luxe_private.traffic_pages()) then
    raise exception 'Public page allowlist changed or contains private routes';
  end if;
end;
$test$;

delete from luxe_private.traffic_events;
delete from luxe_private.traffic_visitors;
delete from luxe_private.traffic_dimensions;
delete from luxe_private.traffic_daily;
delete from luxe_private.notification_email_outbox;
delete from luxe_private.notification_email_budget;
delete from luxe_private.rate_events;
delete from luxe_private.leads;
delete from luxe_private.inbox_audit;
delete from luxe_private.inbox_members;

insert into auth.users (id, email, email_confirmed_at, banned_until, deleted_at) values
  ('a5000000-0000-4000-8000-000000000001', 'traffic-owner@example.invalid', statement_timestamp(), null, null),
  ('a5000000-0000-4000-8000-000000000002', 'traffic-staff@example.invalid', statement_timestamp(), null, null),
  ('a5000000-0000-4000-8000-000000000003', 'traffic-stranger@example.invalid', statement_timestamp(), null, null);
insert into luxe_private.inbox_members (user_id, email, display_name, role, active) values
  ('a5000000-0000-4000-8000-000000000001', 'traffic-owner@example.invalid', 'Synthetic Owner', 'owner', true),
  ('a5000000-0000-4000-8000-000000000002', 'traffic-staff@example.invalid', 'Synthetic Staff', 'staff', true);

insert into luxe_private.leads (id, fingerprint, reference, kind, name, phone, city,
  message, origin, ip_hash, phone_hash, created_at)
select ('b5000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  repeat('a', 64), 'LX-20000101-' || upper(lpad(to_hex(i), 12, '0')), 'quote',
  'Private synthetic customer', '+919000000001', 'Private synthetic city',
  'Private synthetic requirement.', 'https://example.invalid', repeat('b', 64), repeat('c', 64),
  statement_timestamp() - case i when 1 then interval '1 second' when 2 then interval '3 days'
    when 3 then interval '14 days' else interval '45 days' end
from generate_series(1, 4) i;

set local role service_role;
do $test$
declare
  v_owner constant uuid := 'a5000000-0000-4000-8000-000000000001';
  v_page text;
  v_days integer;
begin
  if public.luxe_traffic_readiness() <> '{"schemaVersion":"1"}'::jsonb then
    raise exception 'Unexpected traffic readiness';
  end if;
  foreach v_page in array array['/admin', '/reset-password', '/?phone=9000000001', '/#token',
    'https://example.invalid/', '/unknown', '/projects/', '/design-ideas/unknown', ''] loop
    begin
      perform public.luxe_traffic_capture(gen_random_uuid(), repeat('a', 64), v_page, 'direct', 'desktop', 10000);
      raise exception 'Disallowed page accepted: %', v_page;
    exception when sqlstate 'PT400' then null;
    end;
  end loop;
  foreach v_days in array array[0, 1, 8, 31, 91] loop
    begin
      perform public.luxe_inbox_traffic(v_owner, v_days);
      raise exception 'Invalid traffic period accepted';
    exception when sqlstate 'PT400' then null;
    end;
  end loop;
  begin
    perform public.luxe_inbox_traffic(v_owner, null);
    raise exception 'Null traffic period accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_traffic('a5000000-0000-4000-8000-000000000002', 7);
    raise exception 'Staff could access owner traffic';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_traffic('a5000000-0000-4000-8000-000000000003', 7);
    raise exception 'Non-member could access traffic';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_traffic_capture(null, repeat('a', 64), '/', 'direct', 'desktop', 10000);
    raise exception 'Null event accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_traffic_capture(gen_random_uuid(), '127.0.0.1', '/', 'direct', 'desktop', 10000);
    raise exception 'Raw address accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_traffic_capture(gen_random_uuid(), repeat('a', 64), '/', 'google?email=x', 'desktop', 10000);
    raise exception 'Unbucketed source accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_traffic_capture(gen_random_uuid(), repeat('a', 64), '/', 'direct', 'Mozilla/5.0', 10000);
    raise exception 'Raw user agent accepted';
  exception when sqlstate 'PT400' then null;
  end;
  foreach v_days in array array[0, -1, 10001] loop
    begin
      perform public.luxe_traffic_capture(gen_random_uuid(), repeat('a', 64), '/', 'direct', 'desktop', v_days);
      raise exception 'Invalid daily limit accepted';
    exception when sqlstate 'PT400' then null;
    end;
  end loop;
  if public.luxe_traffic_capture('c5000000-0000-4000-8000-000000000001', repeat('a', 64), '/', 'direct', 'desktop', 10000) <> '{"recorded":true}'::jsonb
    or public.luxe_traffic_capture('c5000000-0000-4000-8000-000000000001', repeat('b', 64), '/about', 'referral', 'other', 10000) <> '{"recorded":false}'::jsonb
    or public.luxe_traffic_capture('c5000000-0000-4000-8000-000000000002', repeat('a', 64), '/projects', 'google', 'mobile', 10000) <> '{"recorded":true}'::jsonb
    or public.luxe_traffic_capture('c5000000-0000-4000-8000-000000000003', repeat('b', 64), '/design-ideas/kitchen', 'instagram', 'tablet', 10000) <> '{"recorded":true}'::jsonb then
    raise exception 'Capture or UUID idempotency failed';
  end if;
end;
$test$;

reset role;
do $test$
begin
  if exists (select 1 from luxe_private.traffic_events where created_at > clock_timestamp()
      or day <> (created_at at time zone 'Asia/Kolkata')::date)
    or exists (select 1 from luxe_private.traffic_visitors where last_seen_at > clock_timestamp()) then
    raise exception 'Capture used an invalid server timestamp or IST day';
  end if;
end;
$test$;
-- A whole SQL test batch shares statement_timestamp. Real capture and analytics
-- use separate requests; emulate an already-observed visit for the read fixture.
update luxe_private.traffic_visitors set last_seen_at = statement_timestamp() - interval '1 second';
set local role service_role;

do $test$
declare
  v_result jsonb;
  v_days integer;
  v_day date := (statement_timestamp() at time zone 'Asia/Kolkata')::date;
begin
  foreach v_days in array array[7, 30, 90] loop
    v_result := public.luxe_inbox_traffic('a5000000-0000-4000-8000-000000000001', v_days);
    if v_result->>'enabled' <> 'true' or (v_result->>'days')::integer <> v_days
      or v_result->>'timeZone' <> 'Asia/Kolkata' or (v_result->>'from')::date <> v_day - (v_days - 1)
      or (v_result->>'through')::date <> v_day or jsonb_array_length(v_result->'daily') <> v_days
      or jsonb_array_length(v_result->'pages') <> 35 or jsonb_array_length(v_result->'sources') <> 9
      or jsonb_array_length(v_result->'devices') <> 4 then
      raise exception 'Traffic response shape or IST period failed';
    end if;
    if v_result->'summary' <> jsonb_build_object('pageViews', 3, 'visitorDays', 2,
      'recentVisitors', 2, 'leads', case v_days when 7 then 2 when 30 then 3 else 4 end)
      or (select sum((x->>'pageViews')::integer) from jsonb_array_elements(v_result->'daily') x) <> 3
      or (select sum((x->>'leads')::integer) from jsonb_array_elements(v_result->'daily') x)
        <> (v_result->'summary'->>'leads')::integer
      or not exists (select 1 from jsonb_array_elements(v_result->'sources') x
        where x = '{"source":"pinterest","pageViews":0}'::jsonb)
      or not exists (select 1 from jsonb_array_elements(v_result->'devices') x
        where x = '{"device":"mobile","pageViews":1}'::jsonb) then
      raise exception 'Visitor deduplication, chart zero-fill or lead counts failed: %', v_result->'summary';
    end if;
    if v_result::text like '%Private synthetic%' or v_result::text like '%9000000001%'
      or v_result::text like '%' || repeat('a', 64) || '%' or v_result::text like '%visitor_hash%'
      or v_result::text like '%c5000000%' or v_result::text like '%traffic-owner%' then
      raise exception 'Traffic response disclosed private identity or customer data';
    end if;
  end loop;
end;
$test$;
reset role;

do $test$
begin
  if (select count(*) from luxe_private.leads) <> 4
    or (select count(*) from luxe_private.notification_email_outbox) <> 4
    or exists (select 1 from luxe_private.notification_email_outbox where attempts <> 0 or state <> 'pending')
    or exists (select 1 from luxe_private.rate_events) or exists (select 1 from luxe_private.inbox_audit)
    or (select count(*) from luxe_private.traffic_events) <> 3
    or (select count(*) from luxe_private.traffic_visitors) <> 2 then
    raise exception 'Traffic altered customer/alert state or duplicate counters';
  end if;
end;
$test$;

delete from luxe_private.traffic_events;
delete from luxe_private.traffic_visitors;
delete from luxe_private.traffic_daily;
set local role service_role;
do $test$
begin
  for i in 1..100 loop
    if public.luxe_traffic_capture(gen_random_uuid(), repeat('c', 64), '/', 'direct', 'desktop', 10000)->>'recorded' <> 'true' then
      raise exception 'Visitor cap rejected event before 100';
    end if;
  end loop;
  if public.luxe_traffic_capture(gen_random_uuid(), repeat('c', 64), '/', 'direct', 'desktop', 10000)->>'recorded' <> 'false'
    or public.luxe_traffic_capture(gen_random_uuid(), repeat('d', 64), '/', 'direct', 'desktop', 100)->>'recorded' <> 'false'
    or public.luxe_traffic_capture(gen_random_uuid(), repeat('d', 64), '/', 'direct', 'desktop', 101)->>'recorded' <> 'true'
    or public.luxe_traffic_capture(gen_random_uuid(), repeat('e', 64), '/', 'direct', 'desktop', 101)->>'recorded' <> 'false' then
    raise exception 'Visitor/global quotas did not fail closed';
  end if;
end;
$test$;
reset role;
do $test$
begin
  if (select sum(page_views) from luxe_private.traffic_daily) <> 101
    or (select sum(visitor_days) from luxe_private.traffic_daily) <> 2
    or (select count(*) from luxe_private.traffic_events) <> 101
    or (select count(*) from luxe_private.traffic_visitors) <> 2
    or (select sum(page_views) from luxe_private.traffic_dimensions where dimension = 'page') <> 101 then
    raise exception 'Quota drops consumed aggregate, visitor or event capacity';
  end if;
end;
$test$;

-- Seed exact retention boundaries, old aggregates and a past recent visitor.
insert into luxe_private.traffic_daily (day, page_views, visitor_days) values
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 90, 1, 1),
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 89, 2, 1),
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 7, 3, 1),
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 6, 4, 1);
insert into luxe_private.traffic_dimensions (day, dimension, bucket, page_views) values
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 90, 'page', '/about', 1),
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 89, 'page', '/about', 2);
insert into luxe_private.traffic_events (id, day, created_at) values
  ('d5000000-0000-4000-8000-000000000001', (statement_timestamp() at time zone 'Asia/Kolkata')::date - 7, statement_timestamp() - interval '7 days'),
  ('d5000000-0000-4000-8000-000000000002', (statement_timestamp() at time zone 'Asia/Kolkata')::date - 6, statement_timestamp() - interval '6 days');
insert into luxe_private.traffic_visitors (day, visitor_hash, page_views, last_seen_at) values
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 7, repeat('f', 64), 1, statement_timestamp() - interval '7 days'),
  ((statement_timestamp() at time zone 'Asia/Kolkata')::date - 6, repeat('f', 64), 1, statement_timestamp() - interval '6 days');
update luxe_private.traffic_visitors set last_seen_at = statement_timestamp() - interval '16 minutes';
set local role service_role;
select public.luxe_traffic_capture('d5000000-0000-4000-8000-000000000003', repeat('f', 64), '/contact', 'referral', 'other', 10000);
reset role;
update luxe_private.traffic_visitors set last_seen_at = statement_timestamp() - interval '1 second'
  where day = (statement_timestamp() at time zone 'Asia/Kolkata')::date and visitor_hash = repeat('f', 64);
do $test$
declare
  v_day date := (statement_timestamp() at time zone 'Asia/Kolkata')::date;
  v_result jsonb;
begin
  if exists (select 1 from luxe_private.traffic_events where day < v_day - 6)
    or exists (select 1 from luxe_private.traffic_visitors where day < v_day - 6)
    or exists (select 1 from luxe_private.traffic_daily where day < v_day - 89)
    or exists (select 1 from luxe_private.traffic_dimensions where day < v_day - 89)
    or not exists (select 1 from luxe_private.traffic_events where day = v_day - 6)
    or not exists (select 1 from luxe_private.traffic_visitors where day = v_day - 6)
    or not exists (select 1 from luxe_private.traffic_daily where day = v_day - 89) then
    raise exception 'Seven/ninety IST-day retention boundary incorrect';
  end if;
  v_result := public.luxe_inbox_traffic('a5000000-0000-4000-8000-000000000001', 90);
  if v_result->'summary'->>'pageViews' <> '111' or v_result->'summary'->>'visitorDays' <> '6'
    or v_result->'summary'->>'recentVisitors' <> '1' then
    raise exception 'Retained aggregates or recent visitor estimate incorrect: %', v_result->'summary';
  end if;
end;
$test$;

set local role anon;
do $test$
begin
  begin
    perform public.luxe_traffic_readiness();
    raise exception 'Anonymous traffic readiness executed';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.luxe_traffic_capture(gen_random_uuid(), repeat('a', 64), '/', 'direct', 'desktop', 10000);
    raise exception 'Anonymous traffic capture executed';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
reset role;

rollback;
