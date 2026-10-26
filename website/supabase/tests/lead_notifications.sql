-- TESTS ONLY: disposable database after migrations 001, 002 and 003.
-- This is not a production setup query. Every fixture is rolled back.
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
      raise exception '% has private schema access', v_role;
    end if;
    foreach v_table in array array['notification_email_outbox', 'notification_email_budget'] loop
      if pg_catalog.has_table_privilege(v_role, 'luxe_private.' || v_table, 'SELECT,INSERT,UPDATE,DELETE') then
        raise exception '% has direct access to %', v_role, v_table;
      end if;
      if not (select relrowsecurity from pg_catalog.pg_class
        where oid = ('luxe_private.' || v_table)::regclass) then
        raise exception '% lacks RLS', v_table;
      end if;
    end loop;
  end loop;
  foreach v_rpc in array array['public.luxe_email_claim(uuid)',
    'public.luxe_email_prepare(uuid,uuid,jsonb,integer)',
    'public.luxe_email_settle(uuid,uuid,text,text,text,integer)',
    'public.luxe_email_readiness()', 'public.luxe_inbox_notifications(uuid)'] loop
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
      raise exception 'RPC not security definer with empty search path';
    end if;
  end loop;
end;
$test$;

delete from luxe_private.notification_email_outbox;
delete from luxe_private.notification_email_budget;
delete from luxe_private.inbox_audit;
delete from luxe_private.inbox_members;
delete from luxe_private.rate_events;
delete from luxe_private.leads;

insert into auth.users (id, email, email_confirmed_at) values
  ('a3000000-0000-4000-8000-000000000001', 'notification-owner@example.invalid', clock_timestamp()),
  ('a3000000-0000-4000-8000-000000000002', 'notification-staff@example.invalid', clock_timestamp());
insert into luxe_private.inbox_members (user_id, email, display_name, role) values
  ('a3000000-0000-4000-8000-000000000001', 'notification-owner@example.invalid', 'Synthetic Owner', 'owner'),
  ('a3000000-0000-4000-8000-000000000002', 'notification-staff@example.invalid', 'Synthetic Staff', 'staff');

-- This helper and all its data disappear on rollback. No real address is sent.
create function luxe_private.notification_test_lead(p_n integer)
returns uuid language plpgsql set search_path = '' as $fixture$
declare
  v_id uuid := ('b3000000-0000-4000-8000-' || pg_catalog.lpad(p_n::text, 12, '0'))::uuid;
begin
  insert into luxe_private.leads (id, fingerprint, reference, kind, name, phone,
    city, message, origin, ip_hash, phone_hash)
    values (v_id, pg_catalog.repeat('a', 64), 'LX-20000101-' || pg_catalog.upper(pg_catalog.lpad(pg_catalog.to_hex(p_n), 12, '0')),
      'quote', 'Synthetic notification test', '+919000000001', 'Disposable City',
      'Disposable requirement only.', 'https://example.invalid', pg_catalog.repeat('b', 64), pg_catalog.repeat('c', 64));
  return v_id;
end;
$fixture$;

do $test$
declare
  v_id uuid;
  v_job jsonb;
  v_first jsonb;
  v_retry jsonb;
  v_result jsonb;
  v_payload jsonb := '{"from":"LuxeInfra <leads@alerts.luxeinfra.in>","to":["sales@luxeinfra.in","infoluxeinfra@gmail.com"],"subject":"Synthetic notification","text":"Disposable text.","html":"<p>Disposable text.</p>"}'::jsonb;
  v_lease constant uuid := 'c3000000-0000-4000-8000-000000000001';
  v_other constant uuid := 'c3000000-0000-4000-8000-000000000002';
  v_provider constant text := 'd3000000-0000-4000-8000-000000000001';
begin
  if public.luxe_email_readiness() <> '{"schemaVersion":"1"}'::jsonb then
    raise exception 'Readiness differs from contract';
  end if;
  v_id := luxe_private.notification_test_lead(1);
  if (select count(*) from luxe_private.notification_email_outbox where lead_id = v_id) <> 1
    or (select notification_status from luxe_private.leads where id = v_id) <> 'pending' then
    raise exception 'New lead was not queued atomically';
  end if;
  -- A repeated intake receipt must not create another notification event.
  v_result := public.luxe_submit_enquiry(v_id, repeat('a', 64), 'quote', 'Synthetic notification test',
    '+919000000001', 'Disposable City', 'Disposable requirement only.', 'https://example.invalid', repeat('b', 64), repeat('c', 64));
  if not (v_result->>'duplicate')::boolean or (select count(*) from luxe_private.notification_email_outbox) <> 1 then
    raise exception 'Duplicate receipt queued email again';
  end if;
  v_job := public.luxe_email_claim(v_lease);
  if v_job->>'leadId' <> v_id::text or v_job->>'attempts' <> '1'
    or v_job->>'idempotencyKey' <> 'new-lead-email-v1/' || v_id::text
    or v_job->'payload' <> 'null'::jsonb or v_job->'lead'->>'phone' <> '+919000000001'
    or public.luxe_email_claim(v_other) is not null then
    raise exception 'Claim shape or active lease exclusivity failed';
  end if;
  begin
    perform public.luxe_email_settle((v_job->>'id')::uuid, v_lease, 'accepted', v_provider, null);
    raise exception 'Unprepared job accepted';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.luxe_email_prepare((v_job->>'id')::uuid, v_other, v_payload, 80);
    raise exception 'Wrong lease prepared email';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease,
      v_payload || '{"to":["outsider@example.invalid","sales@luxeinfra.in"]}'::jsonb, 80);
    raise exception 'Unapproved recipient accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease,
      v_payload || '{"from":"leads@luxeinfra.in"}'::jsonb, 80);
    raise exception 'Unapproved sender accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease,
      v_payload || '{"headers":{"bcc":"outsider@example.invalid"}}'::jsonb, 80);
    raise exception 'Extra payload field accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease,
      v_payload || jsonb_build_object('subject', E'Subject\r\nBcc: outside'), 80);
    raise exception 'Subject header injection accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease,
      v_payload || jsonb_build_object('html', repeat('x', 100001)), 80);
    raise exception 'Oversized body accepted';
  exception when sqlstate 'PT400' then null;
  end;
  v_first := public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 80);
  v_retry := public.luxe_email_prepare((v_job->>'id')::uuid, v_lease,
    v_payload || '{"subject":"Changed template must not replace frozen payload"}'::jsonb, 80);
  if v_first <> v_retry or v_first->'payload' <> v_payload or v_first->>'firstSendAt' is null
    or (select sum(recipients) from luxe_private.notification_email_budget) <> 2 then
    raise exception 'Payload or quota not frozen exactly once';
  end if;
  v_result := public.luxe_email_settle((v_job->>'id')::uuid, v_lease, 'retry', null, 'provider_rate_limited', 120);
  if v_result->>'state' <> 'retry'
    or (select next_attempt_at from luxe_private.notification_email_outbox where lead_id = v_id) < clock_timestamp() + interval '119 seconds'
    or (select notification_status from luxe_private.leads where id = v_id) <> 'pending' then
    raise exception 'Retry outcome or bounded provider delay not preserved';
  end if;
  if public.luxe_email_settle((v_job->>'id')::uuid, v_lease, 'retry', null, 'provider_rate_limited', 120) <> v_result then
    raise exception 'Repeated settlement was not idempotent';
  end if;
  update luxe_private.notification_email_outbox set next_attempt_at = clock_timestamp() - interval '1 second' where lead_id = v_id;
  v_retry := public.luxe_email_claim(v_other);
  if v_retry->>'attempts' <> '2' or v_retry->'payload' <> v_payload
    or v_retry->>'idempotencyKey' <> v_first->>'idempotencyKey' then
    raise exception 'Retry lost frozen request';
  end if;
  begin
    perform public.luxe_email_settle((v_job->>'id')::uuid, v_lease, 'accepted', v_provider, null);
    raise exception 'Stale lease settled reclaimed job';
  exception when sqlstate 'PT409' then null;
  end;
  begin
    perform public.luxe_email_settle((v_job->>'id')::uuid, v_other, 'accepted', 'provider arbitrary body', null);
    raise exception 'Invalid provider ID accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_email_settle((v_job->>'id')::uuid, v_other, 'retry', null, 'private_provider_response');
    raise exception 'Arbitrary provider response persisted as an error code';
  exception when sqlstate 'PT400' then null;
  end;
  v_result := public.luxe_email_settle((v_job->>'id')::uuid, v_other, 'accepted', v_provider, null);
  v_retry := public.luxe_email_settle((v_job->>'id')::uuid, v_other, 'accepted', v_provider, null);
  if v_result->>'state' <> 'accepted' or v_retry <> v_result
    or (select notification_status from luxe_private.leads where id = v_id) <> 'sent' then
    raise exception 'Provider acceptance not recorded idempotently';
  end if;
  v_result := public.luxe_inbox_notifications('a3000000-0000-4000-8000-000000000001');
  if v_result->'summary'->>'accepted' <> '1' or v_result->'items'->0->>'state' <> 'accepted'
    or v_result::text like '%Disposable requirement%' or v_result::text like '%9000000001%'
    or v_result::text like '%payload%' or v_result::text like '%delivered%' then
    raise exception 'Owner report leaked payload/PII or claimed delivery';
  end if;
  begin
    perform public.luxe_inbox_notifications('a3000000-0000-4000-8000-000000000002');
    raise exception 'Staff accessed owner notification report';
  exception when sqlstate 'PT403' then null;
  end;
end;
$test$;

do $test$
declare
  v_id uuid;
  v_job jsonb;
  v_result jsonb;
  v_payload jsonb := '{"from":"leads@alerts.luxeinfra.in","to":["sales@luxeinfra.in","infoluxeinfra@gmail.com"],"subject":"Synthetic notification","text":"Disposable text.","html":"<p>Disposable text.</p>"}'::jsonb;
  v_lease constant uuid := 'c3000000-0000-4000-8000-000000000003';
  v_other constant uuid := 'c3000000-0000-4000-8000-000000000004';
begin
  v_id := luxe_private.notification_test_lead(2);
  v_job := public.luxe_email_claim(v_lease);
  v_result := public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 2);
  if v_result <> '{"deferred":true}'::jsonb
    or (select payload is not null or first_send_at is not null or attempts <> 0 or state <> 'retry'
      from luxe_private.notification_email_outbox where lead_id = v_id)
    or (select sum(recipients) from luxe_private.notification_email_budget) <> 2 then
    raise exception 'Daily budget failed or deferral consumed sending attempt';
  end if;
  -- Deferred job remains unavailable until next UTC day.
  if public.luxe_email_claim(v_other) is not null then raise exception 'Budget-deferred job immediately reclaimed'; end if;
  update luxe_private.notification_email_outbox set next_attempt_at = clock_timestamp() - interval '1 second' where lead_id = v_id;
  v_job := public.luxe_email_claim(v_other);
  perform public.luxe_email_prepare((v_job->>'id')::uuid, v_other, v_payload, 80);
  -- Simulate crash after provider submission. Expired lease reuses same key/body.
  update luxe_private.notification_email_outbox set lease_until = clock_timestamp() - interval '1 second' where lead_id = v_id;
  v_result := public.luxe_email_claim(v_lease);
  if v_result->>'leadId' <> v_id::text or v_result->>'attempts' <> '2'
    or v_result->'payload' <> v_payload then raise exception 'Expired lease was not safely recovered'; end if;
  begin
    perform public.luxe_email_settle((v_job->>'id')::uuid, v_other, 'accepted', 'd3000000-0000-4000-8000-000000000002', null);
    raise exception 'Previous crashed worker settled current job';
  exception when sqlstate 'PT409' then null;
  end;
  update luxe_private.notification_email_outbox set lease_until = clock_timestamp() - interval '1 second',
    first_send_at = clock_timestamp() - interval '23 hours' where lead_id = v_id;
  v_result := public.luxe_email_claim(v_other);
  if v_result is not null
    or (select state from luxe_private.notification_email_outbox where lead_id = v_id) <> 'needs_review' then
    raise exception 'Ambiguous request replayed outside provider window';
  end if;
  v_id := luxe_private.notification_test_lead(3);
  update luxe_private.notification_email_outbox set created_at = clock_timestamp() - interval '24 hours' where lead_id = v_id;
  v_result := public.luxe_email_claim(v_other);
  if v_result is not null
    or (select state from luxe_private.notification_email_outbox where lead_id = v_id) <> 'expired' then
    raise exception 'Stale unprepared lead was sent';
  end if;
  v_id := luxe_private.notification_test_lead(4);
  v_job := public.luxe_email_claim(v_lease);
  perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 80);
  update luxe_private.notification_email_outbox set attempts = 5 where lead_id = v_id;
  v_result := public.luxe_email_settle((v_job->>'id')::uuid, v_lease, 'retry', null, 'provider_outcome_uncertain');
  v_job := public.luxe_email_claim(v_other);
  if v_result->>'state' <> 'needs_review' or v_job is not null then
    raise exception 'Retry limit did not stop ambiguous provider calls';
  end if;
  v_id := luxe_private.notification_test_lead(5);
  v_job := public.luxe_email_claim(v_lease);
  perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 80);
  v_result := public.luxe_email_settle((v_job->>'id')::uuid, v_lease, 'failed', null, 'provider_rejected');
  if v_result->>'state' <> 'failed'
    or (select notification_status from luxe_private.leads where id = v_id) <> 'failed' then
    raise exception 'Permanent failure was not final';
  end if;
  -- First prepare rechecks cutoff even if lease was acquired just before it.
  v_id := luxe_private.notification_test_lead(6);
  v_job := public.luxe_email_claim(v_lease);
  update luxe_private.notification_email_outbox set created_at = clock_timestamp() - interval '24 hours' where lead_id = v_id;
  if public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 80)->>'state' <> 'expired' then
    raise exception 'Prepare did not fence newly expired unprepared job';
  end if;
  v_id := luxe_private.notification_test_lead(7);
  v_job := public.luxe_email_claim(v_lease);
  perform public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 80);
  update luxe_private.notification_email_outbox set first_send_at = clock_timestamp() - interval '23 hours' where lead_id = v_id;
  if public.luxe_email_prepare((v_job->>'id')::uuid, v_lease, v_payload, 80)->>'state' <> 'needs_review' then
    raise exception 'Prepare did not fence newly expired provider window';
  end if;
end;
$test$;

set local role anon;
do $test$
begin
  begin
    perform public.luxe_email_readiness();
    raise exception 'Anonymous user accessed worker RPC';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
reset role;
set local role service_role;
do $test$
begin
  begin
    perform 1 from luxe_private.notification_email_outbox;
    raise exception 'Server credential read private outbox directly';
  exception when insufficient_privilege then null;
  end;
  if public.luxe_email_readiness() <> '{"schemaVersion":"1"}'::jsonb then
    raise exception 'Server credential failed readiness RPC';
  end if;
end;
$test$;
reset role;

rollback;
