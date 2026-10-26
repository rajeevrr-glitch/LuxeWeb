-- TESTS ONLY. Never run this file against the live project.
-- The disposable harness must explicitly opt in before running this file.
-- Setup is supabase/migrations/202610270004_lead_workflow.sql instead.
do $guard$
begin
  if pg_catalog.current_setting('luxe.disposable_tests', true) is distinct from 'true' then
    raise exception 'TESTS ONLY: use a disposable database and explicitly enable luxe.disposable_tests. For setup run migrations/202610270004_lead_workflow.sql.';
  end if;
end;
$guard$;

begin;

do $test$
declare
  v_role text;
  v_rpc text;
  v_proc pg_catalog.pg_proc%rowtype;
begin
  foreach v_role in array array['anon', 'authenticated', 'service_role'] loop
    if pg_catalog.has_schema_privilege(v_role, 'luxe_private', 'USAGE')
      or pg_catalog.has_table_privilege(v_role, 'luxe_private.leads', 'SELECT,INSERT,UPDATE,DELETE')
      or pg_catalog.has_function_privilege(v_role, 'luxe_private.inbox_assignee_active(uuid)', 'EXECUTE') then
      raise exception '% received direct private workflow access', v_role;
    end if;
  end loop;
  foreach v_rpc in array array['public.luxe_inbox_work_list(uuid,text,text,text,integer,text)',
    'public.luxe_inbox_work_update(uuid,uuid,text,text,timestamptz,timestamptz,boolean,uuid)',
    'public.luxe_inbox_workflow_readiness()'] loop
    foreach v_role in array array['anon', 'authenticated'] loop
      if pg_catalog.has_function_privilege(v_role, v_rpc, 'EXECUTE') then
        raise exception '% can execute workflow RPC %', v_role, v_rpc;
      end if;
    end loop;
    if not pg_catalog.has_function_privilege('service_role', v_rpc, 'EXECUTE') then
      raise exception 'Server role cannot execute workflow RPC %', v_rpc;
    end if;
    select * into v_proc from pg_catalog.pg_proc where oid = v_rpc::regprocedure;
    if not v_proc.prosecdef or not ('search_path=""' = any(v_proc.proconfig)) then
      raise exception 'Workflow RPC must use SECURITY DEFINER and empty search_path';
    end if;
  end loop;
end;
$test$;

delete from luxe_private.notification_email_outbox;
delete from luxe_private.notification_email_budget;
delete from luxe_private.rate_events;
delete from luxe_private.leads;
delete from luxe_private.inbox_audit;
delete from luxe_private.inbox_members;

insert into auth.users (id, email, email_confirmed_at, banned_until, deleted_at) values
  ('a4000000-0000-4000-8000-000000000001', 'workflow-owner@example.invalid', statement_timestamp(), null, null),
  ('a4000000-0000-4000-8000-000000000002', 'workflow-staff@example.invalid', statement_timestamp(), null, null),
  ('a4000000-0000-4000-8000-000000000003', 'workflow-disabled@example.invalid', statement_timestamp(), null, null),
  ('a4000000-0000-4000-8000-000000000004', 'workflow-unconfirmed@example.invalid', null, null, null),
  ('a4000000-0000-4000-8000-000000000005', 'workflow-banned@example.invalid', statement_timestamp(), statement_timestamp() + interval '1 day', null),
  ('a4000000-0000-4000-8000-000000000006', 'workflow-deleted@example.invalid', statement_timestamp(), null, statement_timestamp()),
  ('a4000000-0000-4000-8000-000000000007', 'changed-identity@example.invalid', statement_timestamp(), null, null),
  ('a4000000-0000-4000-8000-000000000008', 'workflow-stranger@example.invalid', statement_timestamp(), null, null);
insert into luxe_private.inbox_members (user_id, email, display_name, role, active) values
  ('a4000000-0000-4000-8000-000000000001', 'workflow-owner@example.invalid', 'Synthetic Owner', 'owner', true),
  ('a4000000-0000-4000-8000-000000000002', 'workflow-staff@example.invalid', 'Synthetic Staff', 'staff', true),
  ('a4000000-0000-4000-8000-000000000003', 'workflow-disabled@example.invalid', 'Disabled Staff', 'staff', false),
  ('a4000000-0000-4000-8000-000000000004', 'workflow-unconfirmed@example.invalid', 'Unconfirmed Staff', 'staff', true),
  ('a4000000-0000-4000-8000-000000000005', 'workflow-banned@example.invalid', 'Banned Staff', 'staff', true),
  ('a4000000-0000-4000-8000-000000000006', 'workflow-deleted@example.invalid', 'Deleted Staff', 'staff', true),
  ('a4000000-0000-4000-8000-000000000007', 'workflow-original@example.invalid', 'Changed Identity', 'staff', true);

-- The 30 today items are older than the 30 unscheduled items. Filtering after
-- pagination would incorrectly hide them from the first workflow page.
insert into luxe_private.leads (id, fingerprint, reference, kind, name, phone, city,
  message, origin, ip_hash, phone_hash, status, follow_up_at, created_at)
select ('b4000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid,
  repeat('a', 64), 'LX-20000101-' || upper(lpad(to_hex(i), 12, '0')),
  case when i % 2 = 0 then 'project-brief' else 'quote' end,
  case when i = 1 then 'Literal 100% lead' else 'Synthetic workflow ' || i end,
  '+919000000001', 'Disposable City', 'Disposable workflow requirement.',
  'https://example.invalid', repeat('b', 64), repeat('c', 64),
  case when i = 65 then 'closed' else 'new' end,
  case
    when i <= 30 then (date_trunc('day', statement_timestamp() at time zone 'Asia/Kolkata')
      at time zone 'Asia/Kolkata') + interval '12 hours'
    when i = 61 or i = 65 then date_trunc('day', statement_timestamp() at time zone 'Asia/Kolkata')
      at time zone 'Asia/Kolkata'
    when i = 62 then (date_trunc('day', statement_timestamp() at time zone 'Asia/Kolkata')
      at time zone 'Asia/Kolkata') + interval '1 day' - interval '1 microsecond'
    when i = 63 then (date_trunc('day', statement_timestamp() at time zone 'Asia/Kolkata')
      at time zone 'Asia/Kolkata') - interval '1 microsecond'
    when i = 64 then (date_trunc('day', statement_timestamp() at time zone 'Asia/Kolkata')
      at time zone 'Asia/Kolkata') + interval '1 day'
    when i = 66 then statement_timestamp() - interval '2 days'
    when i = 67 then statement_timestamp() + interval '2 days'
    else null end,
  statement_timestamp() - interval '2 hours' + i * interval '1 minute'
from generate_series(1, 68) i;
update luxe_private.leads set assigned_to = 'a4000000-0000-4000-8000-000000000002'
  where id = 'b4000000-0000-4000-8000-000000000001';
update luxe_private.leads set assigned_to = 'a4000000-0000-4000-8000-000000000001'
  where id in ('b4000000-0000-4000-8000-000000000002', 'b4000000-0000-4000-8000-000000000068');
update luxe_private.leads set assigned_to = ('a4000000-0000-4000-8000-' || right(id::text, 12))::uuid
  where id in ('b4000000-0000-4000-8000-000000000003', 'b4000000-0000-4000-8000-000000000004',
    'b4000000-0000-4000-8000-000000000005', 'b4000000-0000-4000-8000-000000000006',
    'b4000000-0000-4000-8000-000000000007');

set local role service_role;
do $test$
declare
  v_owner constant uuid := 'a4000000-0000-4000-8000-000000000001';
  v_staff constant uuid := 'a4000000-0000-4000-8000-000000000002';
  v_stranger constant uuid := 'a4000000-0000-4000-8000-000000000008';
  v_id constant uuid := 'b4000000-0000-4000-8000-000000000001';
  v_result jsonb;
  v_again jsonb;
  v_old jsonb;
  v_item jsonb;
  v_next jsonb;
  v_member uuid;
  v_work text;
  v_expected_overdue integer := 2;
  v_day timestamptz := date_trunc('day', statement_timestamp() at time zone 'Asia/Kolkata')
    at time zone 'Asia/Kolkata';
begin
  if public.luxe_inbox_workflow_readiness() <> '{"schemaVersion":"1"}'::jsonb then
    raise exception 'Unexpected workflow readiness';
  end if;
  v_result := public.luxe_inbox_work_list(v_owner, '', '', '', 1, '');
  v_old := public.luxe_inbox_list(v_owner);
  if v_result - 'workflow' <> v_old or v_result->>'total' <> '68'
    or not (v_result->'workflow'->>'enabled')::boolean
    or not (v_result->'workflow'->>'canAssign')::boolean
    or v_result->'workflow'->>'timeZone' <> 'Asia/Kolkata'
    or (v_result->'workflow'->>'asOf')::timestamptz <> statement_timestamp()
    or jsonb_array_length(v_result->'workflow'->'assignees') <> 2
    or v_result->'workflow'->'assignees'->0->>'role' <> 'owner'
    or (v_result->'workflow'->'assignees')::text like '%email%' then
    raise exception 'Workflow changed baseline list or disclosed invalid identities';
  end if;
  if v_day < statement_timestamp() then v_expected_overdue := v_expected_overdue + 1; end if;
  if v_day + interval '12 hours' < statement_timestamp() then v_expected_overdue := v_expected_overdue + 30; end if;
  if v_result->'workflow'->'counts'->>'today' <> '32'
    or (v_result->'workflow'->'counts'->>'overdue')::integer <> v_expected_overdue
    or v_result->'workflow'->'counts'->>'unscheduled' <> '31'
    or v_result->'workflow'->'counts'->>'unassigned' <> '64'
    or v_result->'workflow'->'counts'->>'mine' <> '2' then
    raise exception 'Global workflow counts or IST boundary handling incorrect: %', v_result->'workflow'->'counts';
  end if;
  v_result := public.luxe_inbox_work_list(v_owner, '', '', '', 1, 'today');
  v_again := public.luxe_inbox_work_list(v_owner, '', '', '', 2, 'today');
  if v_result->>'total' <> '32' or jsonb_array_length(v_result->'items') <> 25
    or jsonb_array_length(v_again->'items') <> 7 then
    raise exception 'Work filter was applied after pagination';
  end if;
  foreach v_work in array array['today', 'overdue', 'unscheduled', 'unassigned', 'mine'] loop
    v_result := public.luxe_inbox_work_list(v_owner, '', '', '', 1, v_work);
    if exists (select 1 from jsonb_array_elements(v_result->'items') i where i->>'status' = 'closed') then
      raise exception 'Closed lead appeared in workflow %', v_work;
    end if;
    if public.luxe_inbox_work_list(v_owner, '', 'closed', '', 1, v_work)->>'total' <> '0' then
      raise exception 'Closed status bypassed workflow filter %', v_work;
    end if;
  end loop;
  v_result := public.luxe_inbox_work_list(v_owner, '100%', '', 'quote', 1, 'today');
  if v_result->>'total' <> '1' or v_result->'workflow'->'counts'->>'today' <> '32'
    or public.luxe_inbox_work_list(v_owner, '_', '', '', 1, '')->>'total' <> '0'
    or public.luxe_inbox_work_list(v_owner, ''' OR true --', '', '', 1, '')->>'total' <> '0' then
    raise exception 'Workflow search, combined filters or unfiltered counts incorrect';
  end if;
  v_result := public.luxe_inbox_work_list(v_staff, '', '', '', 1, 'mine');
  if (v_result->'workflow'->>'canAssign')::boolean or v_result->>'total' <> '1'
    or v_result->'items'->0->>'id' <> v_id::text
    or v_result->'workflow'->'counts'->>'mine' <> '1' then
    raise exception 'Staff responsibility view incorrect';
  end if;
  v_item := public.luxe_inbox_lead(v_owner, v_id);
  if v_item->'assignedTo' <> jsonb_build_object('id', v_staff, 'displayName', 'Synthetic Staff', 'active', true)
    or (select count(*) from jsonb_object_keys(v_item->'assignedTo')) <> 3 then
    raise exception 'Assignee object differs from private contract';
  end if;
  v_item := public.luxe_inbox_lead(v_owner, 'b4000000-0000-4000-8000-000000000008');
  if v_item->'assignedTo' <> 'null'::jsonb then raise exception 'Unassigned item not null'; end if;
  for i in 3..7 loop
    v_item := public.luxe_inbox_lead(v_owner, ('b4000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid);
    if (v_item->'assignedTo'->>'active')::boolean then
      raise exception 'Disabled or unusable Auth identity appeared active';
    end if;
  end loop;
  begin
    perform public.luxe_inbox_work_list(v_stranger, '', '', '', 1, '');
    raise exception 'Non-member listed workflow';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_work_list(v_owner, '', '', '', 401, '');
    raise exception 'Unbounded workflow page accepted';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_work_list(v_owner, '', '', '', 1, 'invalid');
    raise exception 'Invalid workflow filter accepted';
  exception when sqlstate 'PT400' then null;
  end;
  v_item := public.luxe_inbox_lead(v_owner, v_id);
  begin
    perform public.luxe_inbox_work_update(v_staff, v_id, 'closed', 'Forbidden assignment.', null,
      (v_item->>'updatedAt')::timestamptz, true, null);
    raise exception 'Staff unassigned a lead';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_work_update(v_staff, v_id, 'closed', 'Invalid target.', null,
      (v_item->>'updatedAt')::timestamptz, false, v_owner);
    raise exception 'Target accepted while change flag false';
  exception when sqlstate 'PT400' then null;
  end;
  begin
    perform public.luxe_inbox_work_update(v_owner, v_id, 'closed', 'Invalid flag.', null,
      (v_item->>'updatedAt')::timestamptz, null, null);
    raise exception 'Null assignment flag accepted';
  exception when sqlstate 'PT400' then null;
  end;
  for i in 3..8 loop
    v_member := ('a4000000-0000-4000-8000-' || lpad(i::text, 12, '0'))::uuid;
    begin
      perform public.luxe_inbox_work_update(v_owner, v_id, 'closed', 'Atomic rollback required.', null,
        (v_item->>'updatedAt')::timestamptz, true, v_member);
      raise exception 'Invalid assignment target accepted';
    exception when sqlstate 'PT400' then null;
    end;
  end loop;
  if public.luxe_inbox_lead(v_owner, v_id) <> v_item then raise exception 'Rejected assignment partially edited lead'; end if;
  v_next := public.luxe_inbox_work_update(v_owner, v_id, 'qualified', 'Private workflow note.',
    statement_timestamp() + interval '1 hour', (v_item->>'updatedAt')::timestamptz, true, v_owner);
  if v_next->>'status' <> 'qualified' or v_next->>'notes' <> 'Private workflow note.'
    or v_next->'assignedTo'->>'id' <> v_owner::text
    or (v_next->>'updatedAt')::timestamptz <= (v_item->>'updatedAt')::timestamptz then
    raise exception 'Owner atomic edit and assignment failed';
  end if;
  begin
    perform public.luxe_inbox_work_update(v_owner, v_id, 'closed', 'Stale assignment.', null,
      (v_item->>'updatedAt')::timestamptz, true, v_staff);
    raise exception 'Stale workflow update accepted';
  exception when sqlstate 'PT409' then null;
  end;
  v_item := v_next;
  -- Staff may edit a lead assigned to someone else; assignment is not an ACL.
  v_next := public.luxe_inbox_work_update(v_staff, v_id, 'contacted', 'Shared inbox update.', null,
    (v_item->>'updatedAt')::timestamptz, false, null);
  if v_next->>'status' <> 'contacted' or v_next->'assignedTo'->>'id' <> v_owner::text then
    raise exception 'Staff shared update changed assignment or was denied';
  end if;
  v_item := v_next;
  v_next := public.luxe_inbox_work_update(v_owner, v_id, 'contacted', 'Shared inbox update.', null,
    (v_item->>'updatedAt')::timestamptz, true, null);
  if v_next->'assignedTo' <> 'null'::jsonb then raise exception 'Owner clear assignment failed'; end if;
  v_item := v_next;
  v_next := public.luxe_inbox_work_update(v_owner, v_id, 'contacted', 'Shared inbox update.', null,
    (v_item->>'updatedAt')::timestamptz, true, null);
  if v_next <> v_item then raise exception 'No-op workflow save changed version'; end if;
  -- Old base RPC still edits notes and preserves the new assignment field.
  v_next := public.luxe_inbox_update(v_staff, v_id, 'contacted', 'Legacy-compatible edit.', null,
    (v_item->>'updatedAt')::timestamptz);
  if v_next->>'notes' <> 'Legacy-compatible edit.' or v_next->'assignedTo' <> 'null'::jsonb then
    raise exception 'Existing edit RPC broke after workflow migration';
  end if;
end;
$test$;
reset role;

do $test$
declare
  v_owner constant uuid := 'a4000000-0000-4000-8000-000000000001';
  v_staff constant uuid := 'a4000000-0000-4000-8000-000000000002';
  v_id constant uuid := 'b4000000-0000-4000-8000-000000000002';
  v_item jsonb;
  v_updated jsonb;
  v_result jsonb;
begin
  v_item := public.luxe_inbox_lead(v_owner, v_id);
  v_updated := public.luxe_inbox_work_update(v_owner, v_id, v_item->>'status', v_item->>'notes',
    (v_item->>'followUpAt')::timestamptz, (v_item->>'updatedAt')::timestamptz, true, v_staff);
  perform public.luxe_inbox_access(v_owner, 'workflow-staff@example.invalid', false);
  v_result := public.luxe_inbox_lead(v_owner, v_id);
  if (v_result->'assignedTo'->>'active')::boolean
    or jsonb_array_length(public.luxe_inbox_work_list(v_owner, '', '', '', 1, '')->'workflow'->'assignees') <> 1
    or public.luxe_inbox_work_list(v_owner, v_id::text, '', '', 1, 'unassigned')->>'total' <> '0' then
    -- Search intentionally does not include internal IDs; check item directly below.
    raise exception 'Member disable not reflected in workflow';
  end if;
  if not exists (select 1 from jsonb_array_elements(public.luxe_inbox_work_list(
      v_owner, 'Synthetic workflow 2', '', '', 1, 'unassigned')->'items') i where i->>'id' = v_id::text) then
    raise exception 'Disabled assignee was not counted as unassigned';
  end if;
  begin
    perform public.luxe_inbox_work_update(v_staff, v_id, 'closed', 'Revoked user.', null,
      (v_updated->>'updatedAt')::timestamptz, false, null);
    raise exception 'Revoked staff retained workflow edit access';
  exception when sqlstate 'PT403' then null;
  end;
  begin
    perform public.luxe_inbox_work_update(v_owner, v_id, 'closed', 'Disabled target.', null,
      (v_updated->>'updatedAt')::timestamptz, true, v_staff);
    raise exception 'Disabled target reassigned';
  exception when sqlstate 'PT400' then null;
  end;
  perform public.luxe_inbox_access(v_owner, 'workflow-staff@example.invalid', true);
  if not (public.luxe_inbox_lead(v_owner, v_id)->'assignedTo'->>'active')::boolean then
    raise exception 'Re-enabled member not reflected in assigned item';
  end if;
  update auth.users set banned_until = statement_timestamp() + interval '1 day' where id = v_staff;
  if (public.luxe_inbox_lead(v_owner, v_id)->'assignedTo'->>'active')::boolean then
    raise exception 'Banned Auth user remained valid assignee';
  end if;
  begin
    perform public.luxe_inbox_work_update(v_owner, v_id, 'closed', 'Banned target.', null,
      (v_updated->>'updatedAt')::timestamptz, true, v_staff);
    raise exception 'Banned Auth target assigned';
  exception when sqlstate 'PT400' then null;
  end;
  update auth.users set banned_until = null where id = v_staff;
  if (select count(*) from luxe_private.inbox_audit where details->'changedFields' = '["assignee"]'::jsonb) <> 3
    or exists (select 1 from luxe_private.inbox_audit where details->'changedFields' = '["assignee"]'::jsonb
      and (details::text like '%workflow-staff%' or details::text like '%Private workflow note%')) then
    raise exception 'Assignment audit missing or stored private identity/notes';
  end if;
end;
$test$;

set local role anon;
do $test$
begin
  begin
    perform public.luxe_inbox_workflow_readiness();
    raise exception 'Anonymous workflow RPC executed';
  exception when insufficient_privilege then null;
  end;
end;
$test$;
reset role;

rollback;
