-- PRIVATE LEAD WORKFLOW SETUP. Run after migrations 001, 002 and 003.
-- Copy this entire SETUP file into a fresh Supabase SQL Editor query.
-- Existing leads stay unassigned. No email, account or public access is created.
-- Assignment indicates responsibility; approved inbox staff retain shared access.
begin;

alter table luxe_private.leads add column if not exists assigned_to uuid
  references luxe_private.inbox_members (user_id);
create index if not exists leads_assigned_to_idx
  on luxe_private.leads (assigned_to, created_at desc) where status <> 'closed';

create or replace function luxe_private.inbox_assignee_active(p_user uuid)
returns boolean
language sql
stable
set search_path = ''
as $function$
  select exists (select 1 from luxe_private.inbox_members m
    join auth.users u on u.id = m.user_id
    where m.user_id = p_user and m.active and u.email_confirmed_at is not null
      and pg_catalog.lower(u.email) = m.email and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= pg_catalog.statement_timestamp()));
$function$;
revoke all on function luxe_private.inbox_assignee_active(uuid)
  from public, anon, authenticated, service_role;

-- Extend the existing item helper, preserving every existing field and RPC.
create or replace function luxe_private.inbox_item(p_lead luxe_private.leads)
returns jsonb
language sql
stable
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object('id', p_lead.id, 'reference', p_lead.reference,
    'createdAt', p_lead.created_at, 'updatedAt', p_lead.updated_at, 'kind', p_lead.kind,
    'name', p_lead.name, 'phone', p_lead.phone, 'city', p_lead.city,
    'message', p_lead.message, 'status', p_lead.status, 'notes', p_lead.notes,
    'followUpAt', p_lead.follow_up_at,
    'assignedTo', (select pg_catalog.jsonb_build_object('id', m.user_id,
      'displayName', m.display_name, 'active', luxe_private.inbox_assignee_active(m.user_id))
      from luxe_private.inbox_members m where m.user_id = p_lead.assigned_to));
$function$;
revoke all on function luxe_private.inbox_item(luxe_private.leads)
  from public, anon, authenticated, service_role;

create or replace function public.luxe_inbox_work_list(
  p_actor uuid, p_search text, p_status text, p_kind text, p_page integer, p_work text
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor jsonb;
  v_now timestamptz := pg_catalog.statement_timestamp();
  v_day timestamptz := pg_catalog.date_trunc('day', v_now at time zone 'Asia/Kolkata')
    at time zone 'Asia/Kolkata';
  v_result jsonb;
begin
  v_actor := luxe_private.inbox_actor(p_actor);
  if p_search is null or pg_catalog.char_length(p_search) > 100
    or p_status is null or p_status not in ('', 'new', 'contacted', 'qualified', 'closed')
    or p_kind is null or p_kind not in ('', 'quote', 'project-brief', 'partner')
    or p_page is null or p_page < 1 or p_page > 400
    or p_work is null or p_work not in ('', 'today', 'overdue', 'unscheduled', 'unassigned', 'mine') then
    raise sqlstate 'PT400' using message = 'Invalid inbox workflow filters.';
  end if;
  with all_leads as materialized (
    select l.* from luxe_private.leads l order by l.created_at desc, l.id desc limit 10000
  ), work_flags as materialized (
    select l.id,
      (l.status <> 'closed' and l.follow_up_at >= v_day
        and l.follow_up_at < v_day + interval '1 day') as is_today,
      (l.status <> 'closed' and l.follow_up_at < v_now) as is_overdue,
      (l.status <> 'closed' and l.follow_up_at is null) as is_unscheduled,
      (l.status <> 'closed' and not luxe_private.inbox_assignee_active(l.assigned_to)) as is_unassigned,
      (l.status <> 'closed' and l.assigned_to = p_actor) as is_mine
    from all_leads l
  ), filtered as materialized (
    select l.* from all_leads l join work_flags w on w.id = l.id
    where (p_status = '' or l.status = p_status) and (p_kind = '' or l.kind = p_kind)
      and (pg_catalog.btrim(p_search) = '' or pg_catalog.strpos(
        pg_catalog.lower(pg_catalog.concat_ws(' ', l.reference, l.name, l.phone,
          l.city, l.message, l.notes)), pg_catalog.lower(pg_catalog.btrim(p_search))) > 0)
      and (p_work = '' or (p_work = 'today' and w.is_today)
        or (p_work = 'overdue' and w.is_overdue)
        or (p_work = 'unscheduled' and w.is_unscheduled)
        or (p_work = 'unassigned' and w.is_unassigned)
        or (p_work = 'mine' and w.is_mine))
  ), page_rows as (
    select * from filtered order by created_at desc, id desc
      limit 25 offset ((p_page - 1) * 25)
  )
  select pg_catalog.jsonb_build_object(
    'items', coalesce((select pg_catalog.jsonb_agg(luxe_private.inbox_item(p)
      order by p.created_at desc, p.id desc) from page_rows p), '[]'::jsonb),
    'page', p_page, 'pageSize', 25, 'total', (select pg_catalog.count(*) from filtered),
    'summary', (select pg_catalog.jsonb_build_object(
      'total', pg_catalog.count(*), 'new', pg_catalog.count(*) filter (where status = 'new'),
      'contacted', pg_catalog.count(*) filter (where status = 'contacted'),
      'qualified', pg_catalog.count(*) filter (where status = 'qualified'),
      'closed', pg_catalog.count(*) filter (where status = 'closed'),
      'followUpsDue', pg_catalog.count(*) filter (where status <> 'closed' and follow_up_at <= v_now))
      from all_leads),
    'workflow', pg_catalog.jsonb_build_object('enabled', true, 'canAssign', v_actor->>'role' = 'owner',
      'assignees', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
        'id', a.user_id, 'displayName', a.display_name, 'role', a.role)
        order by (a.role = 'owner') desc, pg_catalog.lower(a.display_name), a.user_id)
        from (select m.user_id, m.display_name, m.role from luxe_private.inbox_members m
          where luxe_private.inbox_assignee_active(m.user_id)
          order by (m.role = 'owner') desc, pg_catalog.lower(m.display_name), m.user_id limit 100) a), '[]'::jsonb),
      'counts', (select pg_catalog.jsonb_build_object(
        'today', pg_catalog.count(*) filter (where is_today),
        'overdue', pg_catalog.count(*) filter (where is_overdue),
        'unscheduled', pg_catalog.count(*) filter (where is_unscheduled),
        'unassigned', pg_catalog.count(*) filter (where is_unassigned),
        'mine', pg_catalog.count(*) filter (where is_mine)) from work_flags),
      'asOf', v_now, 'timeZone', 'Asia/Kolkata')
  ) into v_result;
  return v_result;
end;
$function$;

create or replace function public.luxe_inbox_work_update(
  p_actor uuid, p_id uuid, p_status text, p_notes text,
  p_follow_up_at timestamptz, p_expected_updated_at timestamptz,
  p_change_assignee boolean, p_assigned_to uuid
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor jsonb;
  v_lead luxe_private.leads%rowtype;
begin
  if p_change_assignee is null or (not p_change_assignee and p_assigned_to is not null) then
    raise sqlstate 'PT400' using message = 'Invalid assignment change.';
  end if;
  -- Match inbox_access lock order, so a staff disable and assignment cannot
  -- interleave. Recheck identities only after acquiring this membership lock.
  if p_change_assignee then perform pg_catalog.pg_advisory_xact_lock(1728045811, 2); end if;
  v_actor := luxe_private.inbox_actor(p_actor);
  if p_change_assignee and v_actor->>'role' <> 'owner' then
    raise sqlstate 'PT403' using message = 'Owner access is required to assign enquiries.';
  end if;
  if p_change_assignee and p_assigned_to is not null
    and not luxe_private.inbox_assignee_active(p_assigned_to) then
    raise sqlstate 'PT400' using message = 'Choose an active inbox member.';
  end if;
  if p_id is null then raise sqlstate 'PT400' using message = 'Invalid enquiry identifier.'; end if;
  select * into v_lead from luxe_private.leads where id = p_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Enquiry not found.'; end if;
  -- Existing RPC owns validation, optimistic concurrency and normal edit audit.
  -- Both its update and any assignment remain in this single transaction.
  perform public.luxe_inbox_update(p_actor, p_id, p_status, p_notes,
    p_follow_up_at, p_expected_updated_at);
  if p_change_assignee and v_lead.assigned_to is distinct from p_assigned_to then
    update luxe_private.leads set assigned_to = p_assigned_to where id = p_id;
    insert into luxe_private.inbox_audit (actor_id, actor_name, action, lead_reference, details)
      values (p_actor, v_actor->>'displayName', 'lead_updated', v_lead.reference,
        pg_catalog.jsonb_build_object('changedFields', pg_catalog.jsonb_build_array('assignee')));
  end if;
  select * into v_lead from luxe_private.leads where id = p_id;
  return luxe_private.inbox_item(v_lead);
end;
$function$;

create or replace function public.luxe_inbox_workflow_readiness()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object('schemaVersion', '1');
$function$;

revoke all on function public.luxe_inbox_work_list(uuid, text, text, text, integer, text),
  public.luxe_inbox_work_update(uuid, uuid, text, text, timestamptz, timestamptz, boolean, uuid),
  public.luxe_inbox_workflow_readiness() from public, anon, authenticated, service_role;
grant execute on function public.luxe_inbox_work_list(uuid, text, text, text, integer, text),
  public.luxe_inbox_work_update(uuid, uuid, text, text, timestamptz, timestamptz, boolean, uuid),
  public.luxe_inbox_workflow_readiness() to service_role;

commit;
