-- PRIVATE LEAD INBOX SETUP. Run after 202610260001_lead_intake.sql.
-- Run the complete file as the database owner in Supabase SQL Editor.
-- Create and confirm sales@luxeinfra.in in Authentication first, then run this
-- file again if necessary. This never creates a password or sends an email.
-- Keep luxe_private outside the API's exposed schemas. Only the server's
-- service-role credential can execute the public RPCs below.
begin;

alter table luxe_private.leads add column if not exists notes text not null default '';
alter table luxe_private.leads add column if not exists follow_up_at timestamptz;
do $setup$
begin
  if not exists (select 1 from pg_catalog.pg_constraint
    where conrelid = 'luxe_private.leads'::regclass and conname = 'leads_notes_length') then
    alter table luxe_private.leads add constraint leads_notes_length
      check (pg_catalog.char_length(notes) <= 4000);
  end if;
end;
$setup$;
create index if not exists leads_follow_up_at_idx
  on luxe_private.leads (follow_up_at) where follow_up_at is not null and status <> 'closed';

create table if not exists luxe_private.inbox_members (
  user_id uuid primary key references auth.users (id),
  email text not null unique check (email = pg_catalog.lower(pg_catalog.btrim(email))
    and pg_catalog.char_length(email) between 3 and 254),
  display_name text not null check (pg_catalog.char_length(display_name) between 1 and 80),
  role text not null check (role in ('owner', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);
-- There is one owner. Staff access RPCs cannot create, replace or disable it.
create unique index if not exists inbox_single_owner_idx
  on luxe_private.inbox_members (role) where role = 'owner';

create table if not exists luxe_private.inbox_audit (
  id bigint generated always as identity primary key,
  actor_id uuid not null,
  actor_name text not null,
  action text not null check (action in ('lead_updated', 'staff_added', 'staff_enabled', 'staff_disabled')),
  lead_reference text,
  target_email text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default pg_catalog.clock_timestamp()
);
create index if not exists inbox_audit_created_at_idx
  on luxe_private.inbox_audit (created_at desc, id desc);

create table if not exists luxe_private.inbox_login_events (
  id bigint generated always as identity primary key,
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  occurred_at timestamptz not null default pg_catalog.clock_timestamp()
);
create index if not exists inbox_login_events_ip_time_idx
  on luxe_private.inbox_login_events (ip_hash, occurred_at);
create index if not exists inbox_login_events_time_idx
  on luxe_private.inbox_login_events (occurred_at);

alter table luxe_private.inbox_members enable row level security;
alter table luxe_private.inbox_audit enable row level security;
alter table luxe_private.inbox_login_events enable row level security;
revoke all on schema luxe_private from public, anon, authenticated, service_role;
revoke all on table luxe_private.leads, luxe_private.inbox_members,
  luxe_private.inbox_audit, luxe_private.inbox_login_events
  from public, anon, authenticated, service_role;
revoke all on sequence luxe_private.inbox_audit_id_seq,
  luxe_private.inbox_login_events_id_seq from public, anon, authenticated, service_role;

-- Bootstrap binds the owner's immutable Auth user ID once, at migration time.
-- A later email change or newly registered email can never take over this seat.
do $bootstrap$
declare
  v_user auth.users%rowtype;
begin
  perform pg_catalog.pg_advisory_xact_lock(1728045811, 2);
  if not exists (select 1 from luxe_private.inbox_members where role = 'owner') then
    select * into v_user from auth.users
      where pg_catalog.lower(email) = 'sales@luxeinfra.in'
        and email_confirmed_at is not null and deleted_at is null
        and (banned_until is null or banned_until <= pg_catalog.clock_timestamp());
    if found then
      insert into luxe_private.inbox_members (user_id, email, display_name, role, active)
        values (v_user.id, 'sales@luxeinfra.in', 'LuxeInfra owner', 'owner', true)
        on conflict (user_id) do update set email = excluded.email,
          display_name = excluded.display_name, role = 'owner', active = true,
          updated_at = pg_catalog.clock_timestamp();
    end if;
  end if;
end;
$bootstrap$;

create or replace function luxe_private.inbox_actor(p_actor uuid)
returns jsonb
language plpgsql
stable
set search_path = ''
as $function$
declare
  v_member luxe_private.inbox_members%rowtype;
begin
  select m.* into v_member from luxe_private.inbox_members m
    join auth.users u on u.id = m.user_id
    where m.user_id = p_actor and m.active and u.email_confirmed_at is not null
      and pg_catalog.lower(u.email) = m.email and u.deleted_at is null
      and (u.banned_until is null or u.banned_until <= pg_catalog.statement_timestamp());
  if not found then
    raise sqlstate 'PT403' using message = 'Inbox access is not available for this account.';
  end if;
  return pg_catalog.jsonb_build_object('id', v_member.user_id, 'email', v_member.email,
    'role', v_member.role, 'displayName', v_member.display_name);
end;
$function$;
revoke all on function luxe_private.inbox_actor(uuid) from public, anon, authenticated, service_role;

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
    'followUpAt', p_lead.follow_up_at);
$function$;
revoke all on function luxe_private.inbox_item(luxe_private.leads)
  from public, anon, authenticated, service_role;

create or replace function public.luxe_inbox_actor(p_actor uuid)
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select luxe_private.inbox_actor(p_actor);
$function$;

create or replace function public.luxe_inbox_list(
  p_actor uuid, p_search text default '', p_status text default '',
  p_kind text default '', p_page integer default 1
)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_result jsonb;
begin
  perform luxe_private.inbox_actor(p_actor);
  if p_search is null or pg_catalog.char_length(p_search) > 100
    or p_status is null or p_status not in ('', 'new', 'contacted', 'qualified', 'closed')
    or p_kind is null or p_kind not in ('', 'quote', 'project-brief', 'partner')
    or p_page is null or p_page < 1 or p_page > 400 then
    raise sqlstate 'PT400' using message = 'Invalid inbox filters.';
  end if;
  with all_leads as materialized (
    select l.* from luxe_private.leads l order by l.created_at desc, l.id desc limit 10000
  ), filtered as materialized (
    select l.* from all_leads l
    where (p_status = '' or l.status = p_status) and (p_kind = '' or l.kind = p_kind)
      and (pg_catalog.btrim(p_search) = '' or pg_catalog.strpos(
        pg_catalog.lower(pg_catalog.concat_ws(' ', l.reference, l.name, l.phone,
          l.city, l.message, l.notes)), pg_catalog.lower(pg_catalog.btrim(p_search))) > 0)
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
      'followUpsDue', pg_catalog.count(*) filter (where status <> 'closed'
        and follow_up_at <= pg_catalog.statement_timestamp())) from all_leads)
  ) into v_result;
  return v_result;
end;
$function$;

create or replace function public.luxe_inbox_lead(p_actor uuid, p_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_lead luxe_private.leads%rowtype;
begin
  perform luxe_private.inbox_actor(p_actor);
  if p_id is null then raise sqlstate 'PT400' using message = 'Invalid enquiry identifier.'; end if;
  select * into v_lead from luxe_private.leads where id = p_id;
  if not found then raise sqlstate 'PT404' using message = 'Enquiry not found.'; end if;
  return luxe_private.inbox_item(v_lead);
end;
$function$;

create or replace function public.luxe_inbox_update(
  p_actor uuid, p_id uuid, p_status text, p_notes text,
  p_follow_up_at timestamptz, p_expected_updated_at timestamptz
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor jsonb;
  v_lead luxe_private.leads%rowtype;
  v_changed jsonb := '[]'::jsonb;
begin
  v_actor := luxe_private.inbox_actor(p_actor);
  if p_id is null or p_status is null or p_status not in ('new', 'contacted', 'qualified', 'closed')
    or p_notes is null or pg_catalog.char_length(p_notes) > 4000
    or p_expected_updated_at is null or not pg_catalog.isfinite(p_expected_updated_at)
    or (p_follow_up_at is not null and not pg_catalog.isfinite(p_follow_up_at)) then
    raise sqlstate 'PT400' using message = 'Invalid lead update.';
  end if;
  select * into v_lead from luxe_private.leads where id = p_id for update;
  if not found then raise sqlstate 'PT404' using message = 'Enquiry not found.'; end if;
  if v_lead.updated_at <> p_expected_updated_at then
    raise sqlstate 'PT409' using message = 'This enquiry changed. Refresh it before saving.';
  end if;
  if v_lead.status is distinct from p_status then v_changed := v_changed || '"status"'::jsonb; end if;
  if v_lead.notes is distinct from pg_catalog.btrim(p_notes) then v_changed := v_changed || '"notes"'::jsonb; end if;
  if v_lead.follow_up_at is distinct from p_follow_up_at then v_changed := v_changed || '"followUpAt"'::jsonb; end if;
  if v_changed = '[]'::jsonb then return luxe_private.inbox_item(v_lead); end if;
  update luxe_private.leads set status = p_status, notes = pg_catalog.btrim(p_notes),
    follow_up_at = p_follow_up_at where id = p_id returning * into v_lead;
  insert into luxe_private.inbox_audit (actor_id, actor_name, action, lead_reference, details)
    values (p_actor, v_actor->>'displayName', 'lead_updated', v_lead.reference,
      pg_catalog.jsonb_build_object('changedFields', v_changed,
        'notesLength', pg_catalog.char_length(v_lead.notes)));
  return luxe_private.inbox_item(v_lead);
end;
$function$;

create or replace function public.luxe_inbox_team(p_actor uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor jsonb;
begin
  v_actor := luxe_private.inbox_actor(p_actor);
  if v_actor->>'role' <> 'owner' then
    raise sqlstate 'PT403' using message = 'Owner access is required.';
  end if;
  return pg_catalog.jsonb_build_object(
    'members', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', m.user_id, 'email', m.email, 'displayName', m.display_name,
      'role', m.role, 'active', m.active)
      order by (m.role = 'owner') desc, m.created_at, m.user_id)
      from luxe_private.inbox_members m), '[]'::jsonb),
    'audit', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', a.id::text, 'createdAt', a.created_at, 'actorName', a.actor_name,
      'action', a.action, 'leadReference', a.lead_reference, 'targetEmail', a.target_email)
      order by a.created_at desc, a.id desc)
      from (select * from luxe_private.inbox_audit order by created_at desc, id desc limit 50) a), '[]'::jsonb)
  );
end;
$function$;

create or replace function public.luxe_inbox_access(p_actor uuid, p_email text, p_active boolean)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_actor jsonb;
  v_email text;
  v_user auth.users%rowtype;
  v_member luxe_private.inbox_members%rowtype;
  v_found boolean;
  v_action text;
begin
  v_actor := luxe_private.inbox_actor(p_actor);
  if v_actor->>'role' <> 'owner' then
    raise sqlstate 'PT403' using message = 'Owner access is required.';
  end if;
  if p_email is null or pg_catalog.char_length(p_email) > 254
    or pg_catalog.btrim(p_email) !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
    or p_active is null then raise sqlstate 'PT400' using message = 'Invalid staff access change.'; end if;
  v_email := pg_catalog.lower(pg_catalog.btrim(p_email));
  perform pg_catalog.pg_advisory_xact_lock(1728045811, 2);
  select * into v_member from luxe_private.inbox_members where email = v_email for update;
  v_found := found;
  if v_email = v_actor->>'email' or (v_found and (v_member.role = 'owner' or v_member.user_id = p_actor)) then
    raise sqlstate 'PT400' using message = 'Owner access cannot be changed here.';
  end if;
  if p_active then
    if not v_found and (select pg_catalog.count(*) from luxe_private.inbox_members) >= 100 then
      raise sqlstate 'PT409' using message = 'This workspace has reached its staff access limit.';
    end if;
    select * into v_user from auth.users where pg_catalog.lower(email) = v_email
      and email_confirmed_at is not null and deleted_at is null
      and (banned_until is null or banned_until <= pg_catalog.clock_timestamp());
    if not found then
      raise sqlstate 'PT400' using message = 'Create and confirm this staff account in Supabase first.';
    end if;
    if v_found and v_member.user_id <> v_user.id then
      raise sqlstate 'PT409' using message = 'This email belongs to a different existing account.';
    end if;
    if exists (select 1 from luxe_private.inbox_members
      where user_id = v_user.id and email <> v_email) then
      raise sqlstate 'PT409' using message = 'This account already has a different inbox identity.';
    end if;
    if v_found and v_member.active then
      return pg_catalog.jsonb_build_object('id', v_member.user_id, 'email', v_member.email,
        'displayName', v_member.display_name, 'role', v_member.role, 'active', v_member.active);
    end if;
    v_action := case when v_found then 'staff_enabled' else 'staff_added' end;
    insert into luxe_private.inbox_members (user_id, email, display_name, role, active)
      values (v_user.id, v_email, pg_catalog.left(pg_catalog.split_part(v_email, '@', 1), 80), 'staff', true)
      on conflict (user_id) do update set active = true, updated_at = pg_catalog.clock_timestamp();
  else
    if not v_found then raise sqlstate 'PT404' using message = 'Staff account not found.'; end if;
    if not v_member.active then
      return pg_catalog.jsonb_build_object('id', v_member.user_id, 'email', v_member.email,
        'displayName', v_member.display_name, 'role', v_member.role, 'active', v_member.active);
    end if;
    v_action := 'staff_disabled';
    update luxe_private.inbox_members set active = false,
      updated_at = pg_catalog.clock_timestamp() where user_id = v_member.user_id;
  end if;
  insert into luxe_private.inbox_audit (actor_id, actor_name, action, target_email)
    values (p_actor, v_actor->>'displayName', v_action, v_email);
  select * into v_member from luxe_private.inbox_members where email = v_email;
  return pg_catalog.jsonb_build_object('id', v_member.user_id, 'email', v_member.email,
    'displayName', v_member.display_name, 'role', v_member.role, 'active', v_member.active);
end;
$function$;

create or replace function public.luxe_inbox_login_attempt(p_ip_hash text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz;
begin
  if p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$' then
    raise sqlstate 'PT400' using message = 'Invalid login request.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(1728045811, 3);
  v_now := pg_catalog.clock_timestamp();
  -- No raw IP addresses, email addresses or passwords are retained here.
  delete from luxe_private.inbox_login_events where occurred_at < v_now - interval '1 day';
  if (select pg_catalog.count(*) from luxe_private.inbox_login_events
      where ip_hash = p_ip_hash and occurred_at > v_now - interval '15 minutes') >= 10
    or (select pg_catalog.count(*) from luxe_private.inbox_login_events
      where occurred_at > v_now - interval '1 hour') >= 500
    or (select pg_catalog.count(*) from luxe_private.inbox_login_events) >= 12000 then
    raise sqlstate 'PT429' using message = 'Please wait before trying to sign in again.';
  end if;
  insert into luxe_private.inbox_login_events (ip_hash, occurred_at) values (p_ip_hash, v_now);
  return true;
end;
$function$;

create or replace function public.luxe_inbox_readiness()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object('schemaVersion', '1', 'ownerConfigured',
    exists (select 1 from luxe_private.inbox_members m join auth.users u on u.id = m.user_id
      where m.role = 'owner' and m.active and u.email_confirmed_at is not null
        and pg_catalog.lower(u.email) = m.email and u.deleted_at is null
        and (u.banned_until is null or u.banned_until <= pg_catalog.statement_timestamp())));
$function$;

revoke all on function public.luxe_inbox_actor(uuid),
  public.luxe_inbox_list(uuid, text, text, text, integer),
  public.luxe_inbox_lead(uuid, uuid),
  public.luxe_inbox_update(uuid, uuid, text, text, timestamptz, timestamptz),
  public.luxe_inbox_team(uuid), public.luxe_inbox_access(uuid, text, boolean),
  public.luxe_inbox_login_attempt(text), public.luxe_inbox_readiness()
  from public, anon, authenticated, service_role;
grant execute on function public.luxe_inbox_actor(uuid),
  public.luxe_inbox_list(uuid, text, text, text, integer),
  public.luxe_inbox_lead(uuid, uuid),
  public.luxe_inbox_update(uuid, uuid, text, text, timestamptz, timestamptz),
  public.luxe_inbox_team(uuid), public.luxe_inbox_access(uuid, text, boolean),
  public.luxe_inbox_login_attempt(text), public.luxe_inbox_readiness() to service_role;

commit;
