-- TESTS ONLY. This is not a setup query and must not run on production.
-- Run both migrations first against a disposable Supabase-compatible database.
-- All synthetic users, leads, access changes and counters below are rolled back.
begin;

do $test$
declare
  v_role text;
  v_table text;
  v_rpc text;
  v_proc pg_catalog.pg_proc%rowtype;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    if pg_catalog.has_schema_privilege(v_role, 'luxe_private', 'USAGE') then
      raise exception '% can access private schema', v_role;
    end if;
    foreach v_table in array array['inbox_members', 'inbox_audit', 'inbox_login_events'] loop
      if pg_catalog.has_table_privilege(v_role, 'luxe_private.' || v_table, 'SELECT,INSERT,UPDATE,DELETE') then
        raise exception '% can access % directly', v_role, v_table;
      end if;
      if not (select c.relrowsecurity from pg_catalog.pg_class c
        where c.oid = ('luxe_private.' || v_table)::regclass) then
        raise exception '% lacks RLS', v_table;
      end if;
    end loop;
  end loop;
  foreach v_rpc in array array[
    'public.luxe_inbox_actor(uuid)',
    'public.luxe_inbox_list(uuid,text,text,text,integer)',
    'public.luxe_inbox_lead(uuid,uuid)',
    'public.luxe_inbox_update(uuid,uuid,text,text,timestamptz,timestamptz)',
    'public.luxe_inbox_team(uuid)', 'public.luxe_inbox_access(uuid,text,boolean)',
    'public.luxe_inbox_login_attempt(text)', 'public.luxe_inbox_readiness()'
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
      raise exception 'RPC must use SECURITY DEFINER and empty search_path';
    end if;
  end loop;
end;
$test$;

-- Isolate fixtures from any seeded owner in this disposable test transaction.
delete from luxe_private.inbox_members;
delete from luxe_private.inbox_audit;
delete from luxe_private.inbox_login_events;
delete from luxe_private.rate_events;
delete from luxe_private.leads;

insert into auth.users (id, email, email_confirmed_at, banned_until, deleted_at) values
  ('a1000000-0000-4000-8000-000000000001', 'inbox-owner@example.invalid', clock_timestamp(), null, null),
  ('a1000000-0000-4000-8000-000000000002', 'inbox-staff@example.invalid', clock_timestamp(), null, null),
  ('a1000000-0000-4000-8000-000000000003', 'inbox-stranger@example.invalid', clock_timestamp(), null, null),
  ('a1000000-0000-4000-8000-000000000004', 'inbox-unconfirmed@example.invalid', null, null, null),
  ('a1000000-0000-4000-8000-000000000005', 'inbox-banned@example.invalid', clock_timestamp(), clock_timestamp() + interval '1 day', null),
  ('a1000000-0000-4000-8000-000000000006', 'inbox-deleted@example.invalid', clock_timestamp(), null, clock_timestamp());
insert into luxe_private.inbox_members (user_id, email, display_name, role, active)
  values ('a1000000-0000-4000-8000-000000000001', 'inbox-owner@example.invalid', 'Test Owner', 'owner', true);

insert into luxe_private.leads (id, fingerprint, reference, kind, name, phone,
  city, message, origin, ip_hash, phone_hash, status, created_at, updated_at, follow_up_at)
select ('b1000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  repeat('a', 64), 'LX-20000101-' || upper(lpad(to_hex(i), 12, '0')),
  case i % 3 when 0 then 'quote' when 1 then 'partner' else 'project-brief' end,
  case when i = 1 then 'Literal 100% name' else 'Synthetic Lead ' || i end,
  '+919000000001', 'Disposable City', 'Synthetic requirement only.',
  'https://example.invalid', repeat('b', 64), repeat('c', 64),
  case i % 4 when 0 then 'new' when 1 then 'contacted' when 2 then 'qualified' else 'closed' end,
  '2026-01-01T00:00:00Z'::timestamptz + i * interval '1 minute',
  '2026-01-01T00:00:00Z'::timestamptz + i * interval '1 minute',
  case when i <= 4 then clock_timestamp() - interval '1 day' else null end
from generate_series(1, 30) i;

set local role anon;
do $test$
begin
  begin
    perform public.luxe_inbox_readiness();
    raise exception 'anon executed readiness';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
reset role;

set local role service_role;
do $test$
declare
  v_owner constant uuid := 'a1000000-0000-4000-8000-000000000001';
  v_staff constant uuid := 'a1000000-0000-4000-8000-000000000002';
  v_stranger constant uuid := 'a1000000-0000-4000-8000-000000000003';
  v_id constant uuid := 'b1000000-0000-4000-8000-000000000001';
  v_result jsonb;
  v_page jsonb;
  v_lead jsonb;
  v_updated jsonb;
  v_again jsonb;
begin
  begin
    perform 1 from luxe_private.inbox_members;
    raise exception 'service_role directly read membership';
  exception when insufficient_privilege then null;
  end;
  if public.luxe_inbox_readiness() <> '{"schemaVersion":"1","ownerConfigured":true}'::jsonb then
    raise exception 'Unexpected readiness response';
  end if;
  v_result := public.luxe_inbox_actor(v_owner);
  if v_result->>'role' <> 'owner' or v_result->>'displayName' <> 'Test Owner'
    or (select count(*) from jsonb_object_keys(v_result)) <> 4 then
    raise exception 'Owner actor response differs from contract';
  end if;
  begin
    perform public.luxe_inbox_actor(v_stranger);
    raise exception 'Non-member was authorised';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_list(v_stranger);
    raise exception 'Non-member listed enquiries';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_lead(v_stranger, v_id);
    raise exception 'Non-member read an enquiry';
  exception when sqlstate 'PT403' then null;
  end;
  v_result := public.luxe_inbox_list(v_owner);
  v_page := public.luxe_inbox_list(v_owner, '', '', '', 2);
  if (v_result->>'total')::integer <> 30 or v_result->>'pageSize' <> '25'
    or jsonb_array_length(v_result->'items') <> 25 or jsonb_array_length(v_page->'items') <> 5
    or v_result->'items'->0->>'id' <> 'b1000000-0000-4000-8000-000000000030'
    or v_result->'summary'->>'total' <> '30' or v_result->'summary'->>'new' <> '7'
    or v_result->'summary'->>'contacted' <> '8' or v_result->'summary'->>'qualified' <> '8'
    or v_result->'summary'->>'closed' <> '7' or v_result->'summary'->>'followUpsDue' <> '3'
  then raise exception 'Incorrect pagination, sorting or summary'; end if;
  if (public.luxe_inbox_list(v_owner, '%')->>'total')::integer <> 1
    or (public.luxe_inbox_list(v_owner, '_')->>'total')::integer <> 0
    or (public.luxe_inbox_list(v_owner, ''' OR true --')->>'total')::integer <> 0
    or (public.luxe_inbox_list(v_owner, 'LITERAL 100%')->>'total')::integer <> 1
    or (public.luxe_inbox_list(v_owner, '', '', 'partner')->>'total')::integer <> 10
    or (public.luxe_inbox_list(v_owner, '', 'new')->>'total')::integer <> 7 then
    raise exception 'Filters or literal search were not applied correctly';
  end if;
  begin
    perform public.luxe_inbox_list(v_owner, repeat('a', 101));
    raise exception 'Unbounded search accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_list(v_owner, '', 'invalid');
    raise exception 'Invalid status filter accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_list(v_owner, '', '', '', 401);
    raise exception 'Unbounded page accepted';
  exception when sqlstate 'PT400' then null;
  end;
  v_lead := public.luxe_inbox_lead(v_owner, v_id);
  if (select count(*) from jsonb_object_keys(v_lead)) <> 12 or v_lead ? 'ip_hash'
    or v_lead ? 'fingerprint' or v_lead ? 'phone_hash' or v_lead->>'notes' <> '' then
    raise exception 'Lead returned internal fields or unexpected shape';
  end if;
  begin
    perform public.luxe_inbox_lead(v_owner, 'b1000000-0000-4000-8000-999999999999');
    raise exception 'Unknown enquiry returned';
  exception when sqlstate 'PT404' then null;
  end;
  v_updated := public.luxe_inbox_update(v_owner, v_id, 'qualified', '  Private synthetic note.  ',
    '2027-01-01T09:30:00Z', (v_lead->>'updatedAt')::timestamptz);
  if v_updated->>'status' <> 'qualified' or v_updated->>'notes' <> 'Private synthetic note.'
    or v_updated->>'followUpAt' is null
    or (v_updated->>'updatedAt')::timestamptz <= (v_lead->>'updatedAt')::timestamptz then
    raise exception 'Update was not saved correctly';
  end if;
  v_again := public.luxe_inbox_update(v_owner, v_id, 'qualified', 'Private synthetic note.',
    '2027-01-01T09:30:00Z', (v_updated->>'updatedAt')::timestamptz);
  if v_updated <> v_again then raise exception 'Unchanged update should preserve version'; end if;
  begin
    perform public.luxe_inbox_update(v_owner, v_id, 'closed', 'Stale overwrite.', null,
      (v_lead->>'updatedAt')::timestamptz);
    raise exception 'Stale update was accepted';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.luxe_inbox_update(v_owner, v_id, 'new', repeat('a', 4001), null,
      (v_updated->>'updatedAt')::timestamptz);
    raise exception 'Unbounded notes accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_update(v_owner, v_id, 'new', '', 'infinity',
      (v_updated->>'updatedAt')::timestamptz);
    raise exception 'Infinite follow-up accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_access(v_owner, 'inbox-owner@example.invalid', false);
    raise exception 'Owner disabled self';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_access(v_owner, 'inbox-unconfirmed@example.invalid', true);
    raise exception 'Unconfirmed staff was added';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_access(v_owner, 'inbox-banned@example.invalid', true);
    raise exception 'Banned staff was added';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_access(v_owner, 'inbox-deleted@example.invalid', true);
    raise exception 'Deleted staff was added';
  exception when sqlstate 'PT400' then null;
  end;
  v_result := public.luxe_inbox_access(v_owner, ' INBOX-STAFF@example.invalid ', true);
  if v_result->>'role' <> 'staff' or v_result->>'id' <> v_staff::text
    or not (v_result->>'active')::boolean or (select count(*) from jsonb_object_keys(v_result)) <> 5 then
    raise exception 'Access response differs from bare member contract';
  end if;
  if public.luxe_inbox_actor(v_staff)->>'role' <> 'staff'
    or (public.luxe_inbox_list(v_staff)->>'total')::integer <> 30 then
    raise exception 'Enabled staff could not use inbox';
  end if;
  v_updated := public.luxe_inbox_update(v_staff, v_id, 'contacted', 'Updated by test staff.',
    null, (v_updated->>'updatedAt')::timestamptz);
  if v_updated->>'status' <> 'contacted' or v_updated->'followUpAt' <> 'null'::jsonb then
    raise exception 'Staff update or follow-up clearing failed';
  end if;
  begin
    perform public.luxe_inbox_team(v_staff);
    raise exception 'Staff accessed master admin';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_access(v_staff, 'inbox-owner@example.invalid', false);
    raise exception 'Staff changed owner access';
  exception when sqlstate 'PT403' then null;
  end;
  v_result := public.luxe_inbox_team(v_owner);
  if jsonb_array_length(v_result->'members') <> 2 or jsonb_array_length(v_result->'audit') <> 3
    or jsonb_typeof(v_result->'audit'->0->'id') <> 'string'
    or v_result::text like '%Private synthetic note.%' or v_result::text like '%Synthetic requirement only.%' then
    raise exception 'Team/audit list is incomplete or discloses private note/message';
  end if;
  perform public.luxe_inbox_access(v_owner, 'inbox-staff@example.invalid', false);
  begin
    perform public.luxe_inbox_actor(v_staff);
    raise exception 'Disabled staff remained authorised';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_update(v_staff, v_id, 'closed', '', null,
      (v_updated->>'updatedAt')::timestamptz);
    raise exception 'Disabled staff changed a lead';
  exception when sqlstate 'PT403' then null;
  end;
  perform public.luxe_inbox_access(v_owner, 'inbox-staff@example.invalid', true);
end;
$test$;
reset role;

-- Confirm authority is bound to a confirmed, current, usable Auth account.
do $test$
declare
  v_staff constant uuid := 'a1000000-0000-4000-8000-000000000002';
begin
  update auth.users set email = 'changed@example.invalid' where id = v_staff;
  begin
    perform public.luxe_inbox_actor(v_staff);
    raise exception 'Email-changed account retained access';
  exception when sqlstate 'PT403' then null;
  end;
  update auth.users set email = 'inbox-staff@example.invalid', email_confirmed_at = null where id = v_staff;
  begin
    perform public.luxe_inbox_actor(v_staff);
    raise exception 'Unconfirmed account retained access';
  exception when sqlstate 'PT403' then null;
  end;
  update auth.users set email_confirmed_at = clock_timestamp(), banned_until = clock_timestamp() + interval '1 day'
    where id = v_staff;
  begin
    perform public.luxe_inbox_actor(v_staff);
    raise exception 'Banned account retained access';
  exception when sqlstate 'PT403' then null;
  end;
  update auth.users set banned_until = null, deleted_at = clock_timestamp() where id = v_staff;
  begin
    perform public.luxe_inbox_actor(v_staff);
    raise exception 'Deleted account retained access';
  exception when sqlstate 'PT403' then null;
  end;
  update auth.users set deleted_at = null where id = v_staff;
  if (select count(*) from luxe_private.inbox_audit where action = 'lead_updated') <> 2
    or exists (select 1 from luxe_private.inbox_audit where details::text like '%synthetic note%'
      or details::text like '%Updated by test staff%') then
    raise exception 'Audit stored note contents or counted unchanged/stale updates';
  end if;
end;
$test$;

-- Login quotas count attempts before authentication and preserve no raw IP/PII.
set local role service_role;
do $test$
begin
  begin
    perform public.luxe_inbox_login_attempt('203.0.113.1');
    raise exception 'Raw IP was accepted';
  exception when sqlstate 'PT400' then null;
  end;
  for i in 1..10 loop
    if not public.luxe_inbox_login_attempt(repeat('a', 64)) then
      raise exception 'Valid attempt did not return true';
    end if;
  end loop;
  begin
    perform public.luxe_inbox_login_attempt(repeat('a', 64));
    raise exception 'IP login quota failed';
  exception when sqlstate 'PT429' then null;
  end;
end;
$test$;
reset role;

do $test$
begin
  update luxe_private.inbox_login_events set occurred_at = clock_timestamp() - interval '16 minutes';
  if not public.luxe_inbox_login_attempt(repeat('a', 64)) then
    raise exception 'Expired rolling IP quota did not reopen';
  end if;
  delete from luxe_private.inbox_login_events;
  insert into luxe_private.inbox_login_events (ip_hash, occurred_at)
    select lpad(to_hex(i), 64, '0'), clock_timestamp() from generate_series(1, 500) i;
  begin
    perform public.luxe_inbox_login_attempt(repeat('b', 64));
    raise exception 'Global login quota failed';
  exception when sqlstate 'PT429' then null;
  end;
  update luxe_private.inbox_login_events set occurred_at = clock_timestamp() - interval '61 minutes';
  if not public.luxe_inbox_login_attempt(repeat('b', 64)) then
    raise exception 'Expired rolling global quota did not reopen';
  end if;
  update luxe_private.inbox_login_events set occurred_at = clock_timestamp() - interval '2 days';
  perform public.luxe_inbox_login_attempt(repeat('c', 64));
  if (select count(*) from luxe_private.inbox_login_events) <> 1 then
    raise exception 'Expired login events not pruned';
  end if;
end;
$test$;

rollback;
