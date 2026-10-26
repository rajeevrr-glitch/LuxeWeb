-- LUXEINFRA DATABASE SETUP: copy this entire file into a NEW SQL Editor query.
-- This creates the schema. The separate supabase/tests file does not set it up.
-- Run as the database owner in Supabase SQL Editor. No extension is required.
-- Keep luxe_private out of the API's exposed schemas. Only the two public RPCs
-- are callable, and only with a server-side service-role credential.
begin;

create schema if not exists luxe_private;
revoke all on schema luxe_private from public, anon, authenticated, service_role;
alter default privileges in schema luxe_private
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges in schema luxe_private
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges in schema luxe_private
  revoke execute on functions from public, anon, authenticated, service_role;

create table if not exists luxe_private.leads (
  id uuid primary key,
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  reference text not null unique check (reference ~ '^LX-[0-9]{8}-[0-9A-F]{12}$'),
  kind text not null check (kind in ('quote', 'project-brief', 'partner')),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  phone text not null check (phone ~ '^\+91[6-9][0-9]{9}$'),
  city text not null check (char_length(btrim(city)) between 1 and 100),
  message text not null check (char_length(btrim(message)) between 1 and 10000),
  origin text not null check (char_length(origin) between 1 and 200),
  ip_hash text not null check (ip_hash ~ '^[0-9a-f]{64}$'),
  phone_hash text not null check (phone_hash ~ '^[0-9a-f]{64}$'),
  consent boolean not null default true check (consent),
  consent_version text not null default '2026-10-26',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'qualified', 'closed')),
  notification_status text not null default 'not_configured'
    check (notification_status in ('not_configured', 'pending', 'sent', 'failed')),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp()
);

create index if not exists leads_created_at_idx
  on luxe_private.leads (created_at desc);
create index if not exists leads_status_created_at_idx
  on luxe_private.leads (status, created_at desc);

create or replace function luxe_private.touch_lead_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $function$
begin
  new.updated_at := pg_catalog.clock_timestamp();
  return new;
end;
$function$;
revoke all on function luxe_private.touch_lead_updated_at()
  from public, anon, authenticated, service_role;
create or replace trigger lead_updated_at
  before update on luxe_private.leads
  for each row execute function luxe_private.touch_lead_updated_at();

-- Three small counter events per accepted enquiry give exact rolling windows,
-- including at bucket boundaries. Raw addresses and phone numbers are absent.
create table if not exists luxe_private.rate_events (
  scope text not null check (scope in ('ip', 'phone', 'global')),
  subject_hash text not null check (subject_hash ~ '^[0-9a-f]{64}$'),
  enquiry_id uuid not null references luxe_private.leads (id),
  occurred_at timestamptz not null,
  primary key (scope, enquiry_id)
);
create index if not exists rate_events_subject_time_idx
  on luxe_private.rate_events (scope, subject_hash, occurred_at);
create index if not exists rate_events_time_idx
  on luxe_private.rate_events (occurred_at);

alter table luxe_private.leads enable row level security;
alter table luxe_private.rate_events enable row level security;
revoke all on table luxe_private.leads, luxe_private.rate_events
  from public, anon, authenticated, service_role;

create or replace function public.luxe_submit_enquiry(
  p_id uuid,
  p_fingerprint text,
  p_kind text,
  p_name text,
  p_phone text,
  p_city text,
  p_message text,
  p_origin text,
  p_ip_hash text,
  p_phone_hash text
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz;
  v_day timestamptz;
  v_existing luxe_private.leads%rowtype;
  v_reference text;
  v_global_hash constant text := pg_catalog.repeat('0', 64);
begin
  if p_id is null
    or p_fingerprint is null or p_fingerprint !~ '^[0-9a-f]{64}$'
    or p_ip_hash is null or p_ip_hash !~ '^[0-9a-f]{64}$'
    or p_phone_hash is null or p_phone_hash !~ '^[0-9a-f]{64}$'
    or p_kind is null or p_kind not in ('quote', 'project-brief', 'partner')
    or p_name is null or pg_catalog.btrim(p_name) = '' or pg_catalog.char_length(p_name) > 80
    or p_phone is null or p_phone !~ '^\+91[6-9][0-9]{9}$'
    or p_city is null or pg_catalog.btrim(p_city) = '' or pg_catalog.char_length(p_city) > 100
    or p_message is null or pg_catalog.btrim(p_message) = '' or pg_catalog.char_length(p_message) > 10000
    or p_origin is null or pg_catalog.char_length(p_origin) > 200
    or p_origin !~ '^https://([A-Za-z0-9]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?\.)+[A-Za-z]([A-Za-z0-9-]{0,61}[A-Za-z0-9])?(:[0-9]{1,5})?$'
  then
    raise sqlstate 'PT400' using message = 'Invalid enquiry.';
  end if;

  -- One lock serializes this deliberately bounded intake (at most 500/day).
  -- It protects duplicate detection, all three quotas and total capacity.
  perform pg_catalog.pg_advisory_xact_lock(1728045811, 1);
  v_now := pg_catalog.clock_timestamp();
  v_day := pg_catalog.date_trunc('day', v_now at time zone 'UTC') at time zone 'UTC';

  select * into v_existing from luxe_private.leads where id = p_id;
  if found then
    if v_existing.fingerprint <> p_fingerprint then
      raise sqlstate 'PT409' using message = 'Enquiry identifier already used.';
    end if;
    return pg_catalog.jsonb_build_object(
      'reference', v_existing.reference,
      'created_at', v_existing.created_at,
      'duplicate', true
    );
  end if;

  if (select pg_catalog.count(*) from luxe_private.leads) >= 10000 then
    raise sqlstate 'PT503' using message = 'Enquiry intake is temporarily unavailable.';
  end if;

  if (select pg_catalog.count(*) from luxe_private.rate_events
      where scope = 'ip' and subject_hash = p_ip_hash
        and occurred_at > v_now - interval '10 minutes') >= 12
    or (select pg_catalog.count(*) from luxe_private.rate_events
      where scope = 'phone' and subject_hash = p_phone_hash
        and occurred_at > v_now - interval '1 hour') >= 5
    or (select pg_catalog.count(*) from luxe_private.rate_events
      where scope = 'global' and subject_hash = v_global_hash
        and occurred_at >= v_day) >= 500
  then
    raise sqlstate 'PT429' using message = 'Please wait before sending another enquiry.';
  end if;

  -- Only expired rate counters are removed. Enquiries are never deleted here.
  delete from luxe_private.rate_events where occurred_at < v_now - interval '1 day';

  loop
    v_reference := 'LX-' || pg_catalog.to_char(v_now at time zone 'UTC', 'YYYYMMDD')
      || '-' || pg_catalog.upper(pg_catalog.substr(
        pg_catalog.replace(pg_catalog.gen_random_uuid()::text, '-', ''), 1, 12));
    exit when not exists (select 1 from luxe_private.leads where reference = v_reference);
  end loop;

  insert into luxe_private.leads (
    id, fingerprint, reference, kind, name, phone, city, message, origin,
    ip_hash, phone_hash, consent, consent_version, created_at, updated_at
  ) values (
    p_id, p_fingerprint, v_reference, p_kind, pg_catalog.btrim(p_name), p_phone,
    pg_catalog.btrim(p_city), pg_catalog.btrim(p_message), p_origin,
    p_ip_hash, p_phone_hash, true, '2026-10-26', v_now, v_now
  );
  insert into luxe_private.rate_events (scope, subject_hash, enquiry_id, occurred_at)
  values ('ip', p_ip_hash, p_id, v_now), ('phone', p_phone_hash, p_id, v_now),
    ('global', v_global_hash, p_id, v_now);

  return pg_catalog.jsonb_build_object(
    'reference', v_reference, 'created_at', v_now, 'duplicate', false
  );
end;
$function$;

create or replace function public.luxe_lead_readiness()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object('schemaVersion', '1');
$function$;

revoke all on function public.luxe_submit_enquiry(uuid, text, text, text, text, text, text, text, text, text)
  from public, anon, authenticated, service_role;
revoke all on function public.luxe_lead_readiness()
  from public, anon, authenticated, service_role;
grant execute on function public.luxe_submit_enquiry(uuid, text, text, text, text, text, text, text, text, text)
  to service_role;
grant execute on function public.luxe_lead_readiness() to service_role;

commit;
