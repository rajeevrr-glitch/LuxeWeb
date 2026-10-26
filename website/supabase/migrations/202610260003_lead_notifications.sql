-- PRIVATE EMAIL ALERT OUTBOX. Run after migrations 001 and 002.
-- Run this complete file as database owner. No email is sent by this migration.
-- Only subsequently inserted leads are queued; existing leads are not backfilled.
-- Keep luxe_private outside exposed API schemas. All worker RPCs are server-only.
begin;

create table if not exists luxe_private.notification_email_outbox (
  id uuid primary key default pg_catalog.gen_random_uuid(),
  lead_id uuid not null unique references luxe_private.leads (id),
  event_version integer not null default 1 check (event_version = 1),
  state text not null default 'pending'
    check (state in ('pending', 'leased', 'retry', 'accepted', 'failed', 'needs_review', 'expired')),
  attempts integer not null default 0 check (attempts between 0 and 5),
  idempotency_key text not null unique,
  payload jsonb,
  first_send_at timestamptz,
  reserved_on date,
  lease_token uuid,
  lease_until timestamptz,
  last_lease_token uuid,
  last_outcome text,
  provider_id uuid,
  last_error_code text check (last_error_code is null or last_error_code ~ '^[a-z][a-z0-9_]{0,63}$'),
  next_attempt_at timestamptz not null default pg_catalog.clock_timestamp(),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  constraint email_key_matches_lead check (idempotency_key = 'new-lead-email-v1/' || lead_id::text),
  constraint email_frozen_together check ((payload is null and first_send_at is null and reserved_on is null)
    or (payload is not null and first_send_at is not null and reserved_on is not null)),
  constraint email_lease_pair check ((state = 'leased' and lease_token is not null and lease_until is not null)
    or (state <> 'leased' and lease_token is null and lease_until is null)),
  constraint email_accepted_provider check (state <> 'accepted' or provider_id is not null)
);
create index if not exists notification_email_due_idx
  on luxe_private.notification_email_outbox (next_attempt_at, created_at, id)
  where state in ('pending', 'retry');
create index if not exists notification_email_lease_idx
  on luxe_private.notification_email_outbox (lease_until) where state = 'leased';
create index if not exists notification_email_created_idx
  on luxe_private.notification_email_outbox (created_at desc, id desc);

-- A reservation is two recipients, made once before the first external request.
-- Retain counters: a provider timeout must not free potentially consumed quota.
create table if not exists luxe_private.notification_email_budget (
  day date primary key,
  recipients integer not null check (recipients between 0 and 100)
);
alter table luxe_private.notification_email_outbox enable row level security;
alter table luxe_private.notification_email_budget enable row level security;
revoke all on schema luxe_private from public, anon, authenticated, service_role;
revoke all on table luxe_private.notification_email_outbox, luxe_private.notification_email_budget
  from public, anon, authenticated, service_role;

create or replace function luxe_private.queue_lead_email()
returns trigger
language plpgsql
security definer
set search_path = ''
as $function$
begin
  insert into luxe_private.notification_email_outbox (lead_id, idempotency_key)
    values (new.id, 'new-lead-email-v1/' || new.id::text)
    on conflict (lead_id) do nothing;
  update luxe_private.leads set notification_status = 'pending' where id = new.id;
  return new;
end;
$function$;
revoke all on function luxe_private.queue_lead_email() from public, anon, authenticated, service_role;
create or replace trigger lead_email_queued
  after insert on luxe_private.leads
  for each row execute function luxe_private.queue_lead_email();

create or replace function public.luxe_email_claim(p_lease_token uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_job luxe_private.notification_email_outbox%rowtype;
  v_lead luxe_private.leads%rowtype;
begin
  if p_lease_token is null then raise sqlstate 'PT400' using message = 'Invalid worker lease.'; end if;
  -- Every expiry transition is committed with the claim. Frozen requests may be
  -- ambiguous; never replay them outside Resend's 24-hour deduplication window.
  with changed as (
    update luxe_private.notification_email_outbox set
      state = case when payload is null then 'expired' else 'needs_review' end,
      last_error_code = case when payload is null then 'queue_expired' else 'idempotency_window_elapsed' end,
      lease_token = null, lease_until = null, updated_at = v_now
    where state in ('pending', 'retry', 'leased')
      and ((payload is null and created_at <= v_now - interval '24 hours')
        or (first_send_at is not null and first_send_at <= v_now - interval '23 hours'))
      and (state <> 'leased' or lease_until <= v_now)
    returning lead_id
  ) update luxe_private.leads set notification_status = 'failed'
    where id in (select lead_id from changed);

  -- An expired lease is eligible for the same frozen request, never a new key.
  with changed as (
    update luxe_private.notification_email_outbox set
      state = 'needs_review', last_error_code = 'attempt_limit_reached',
      lease_token = null, lease_until = null, updated_at = v_now
    where attempts >= 5 and ((state = 'leased' and lease_until <= v_now)
      or state in ('pending', 'retry')) returning lead_id
  ) update luxe_private.leads set notification_status = 'failed'
    where id in (select lead_id from changed);

  select * into v_job from luxe_private.notification_email_outbox
    where attempts < 5 and ((state in ('pending', 'retry') and next_attempt_at <= v_now)
      or (state = 'leased' and lease_until <= v_now))
    order by next_attempt_at, created_at, id for update skip locked limit 1;
  if not found then return null; end if;
  update luxe_private.notification_email_outbox set state = 'leased',
    lease_token = p_lease_token, lease_until = v_now + interval '90 seconds',
    attempts = attempts + 1, updated_at = v_now
    where id = v_job.id returning * into v_job;
  select * into v_lead from luxe_private.leads where id = v_job.lead_id;
  return pg_catalog.jsonb_build_object('id', v_job.id, 'leadId', v_job.lead_id,
    'reference', v_lead.reference, 'createdAt', v_job.created_at,
    'attempts', v_job.attempts, 'firstSendAt', v_job.first_send_at,
    'payload', v_job.payload, 'idempotencyKey', v_job.idempotency_key,
    'lead', pg_catalog.jsonb_build_object('name', v_lead.name, 'phone', v_lead.phone,
      'city', v_lead.city, 'kind', v_lead.kind, 'message', v_lead.message));
end;
$function$;

create or replace function public.luxe_email_prepare(
  p_id uuid, p_lease_token uuid, p_payload jsonb, p_daily_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_day date := (v_now at time zone 'UTC')::date;
  v_job luxe_private.notification_email_outbox%rowtype;
  v_reserved integer;
  v_from text;
begin
  if p_id is null or p_lease_token is null or p_daily_limit is null
    or p_daily_limit < 1 or p_daily_limit > 100 then
    raise sqlstate 'PT400' using message = 'Invalid email preparation.';
  end if;
  select * into v_job from luxe_private.notification_email_outbox where id = p_id for update;
  if not found or v_job.state <> 'leased' or v_job.lease_token <> p_lease_token
    or v_job.lease_until <= v_now then
    raise sqlstate 'PT409' using message = 'Worker lease is no longer current.';
  end if;
  if v_job.first_send_at is not null and v_job.first_send_at <= v_now - interval '23 hours' then
    update luxe_private.notification_email_outbox set state = 'needs_review',
      lease_token = null, lease_until = null, last_error_code = 'idempotency_window_elapsed',
      updated_at = v_now where id = p_id;
    update luxe_private.leads set notification_status = 'failed' where id = v_job.lead_id;
    return pg_catalog.jsonb_build_object('blocked', true, 'state', 'needs_review');
  end if;
  -- Frozen payload wins even if the worker's current template has since changed.
  if v_job.payload is not null then
    return pg_catalog.jsonb_build_object('id', v_job.id, 'payload', v_job.payload,
      'idempotencyKey', v_job.idempotency_key, 'firstSendAt', v_job.first_send_at);
  end if;
  if v_job.created_at <= v_now - interval '24 hours' then
    update luxe_private.notification_email_outbox set state = 'expired', lease_token = null,
      lease_until = null, last_error_code = 'queue_expired', updated_at = v_now where id = p_id;
    update luxe_private.leads set notification_status = 'failed' where id = v_job.lead_id;
    return pg_catalog.jsonb_build_object('blocked', true, 'state', 'expired');
  end if;
  if p_payload is null or pg_catalog.jsonb_typeof(p_payload) <> 'object'
    or pg_catalog.octet_length(p_payload::text) > 131072 then
    raise sqlstate 'PT400' using message = 'Invalid email payload.';
  end if;
  if (select pg_catalog.count(*) from pg_catalog.jsonb_object_keys(p_payload)) <> 5
    or not (p_payload ?& array['from', 'to', 'subject', 'text', 'html'])
    or pg_catalog.jsonb_typeof(p_payload->'from') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'subject') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'text') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'html') <> 'string'
    or pg_catalog.jsonb_typeof(p_payload->'to') <> 'array' then
    raise sqlstate 'PT400' using message = 'Invalid email payload fields.';
  end if;
  v_from := p_payload->>'from';
  if pg_catalog.char_length(v_from) > 254
    or not (v_from ~ '^[A-Za-z0-9._+-]+@alerts[.]luxeinfra[.]in$'
      or v_from ~ '^LuxeInfra <[A-Za-z0-9._+-]+@alerts[.]luxeinfra[.]in>$')
    or pg_catalog.char_length(p_payload->>'subject') not between 1 and 200
    or (p_payload->>'subject') ~ '[\r\n]'
    or pg_catalog.char_length(p_payload->>'text') not between 1 and 100000
    or pg_catalog.char_length(p_payload->>'html') not between 1 and 100000
    or not (p_payload->'to' = '["sales@luxeinfra.in","infoluxeinfra@gmail.com"]'::jsonb
      or p_payload->'to' = '["infoluxeinfra@gmail.com","sales@luxeinfra.in"]'::jsonb) then
    raise sqlstate 'PT400' using message = 'Email recipients or content are not permitted.';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(1728045811, 4);
  -- A contending reservation can cross midnight or outlive a lease. Recheck
  -- using the actual time after the global budget lock has been acquired.
  v_now := pg_catalog.clock_timestamp();
  v_day := (v_now at time zone 'UTC')::date;
  if v_job.lease_until <= v_now then
    raise sqlstate 'PT409' using message = 'Worker lease is no longer current.';
  end if;
  if v_job.created_at <= v_now - interval '24 hours' then
    update luxe_private.notification_email_outbox set state = 'expired', lease_token = null,
      lease_until = null, last_error_code = 'queue_expired', updated_at = v_now where id = p_id;
    update luxe_private.leads set notification_status = 'failed' where id = v_job.lead_id;
    return pg_catalog.jsonb_build_object('blocked', true, 'state', 'expired');
  end if;
  select recipients into v_reserved from luxe_private.notification_email_budget where day = v_day;
  if coalesce(v_reserved, 0) + 2 > p_daily_limit then
    update luxe_private.notification_email_outbox set state = 'retry',
      next_attempt_at = ((v_day + 1)::timestamp at time zone 'UTC'),
      attempts = greatest(0, attempts - 1), lease_token = null, lease_until = null,
      last_error_code = 'daily_recipient_limit', updated_at = v_now where id = p_id;
    return pg_catalog.jsonb_build_object('deferred', true);
  end if;
  insert into luxe_private.notification_email_budget (day, recipients) values (v_day, 2)
    on conflict (day) do update set recipients = luxe_private.notification_email_budget.recipients + 2;
  update luxe_private.notification_email_outbox set payload = p_payload,
    first_send_at = v_now, reserved_on = v_day, updated_at = v_now
    where id = p_id returning * into v_job;
  return pg_catalog.jsonb_build_object('id', v_job.id, 'payload', v_job.payload,
    'idempotencyKey', v_job.idempotency_key, 'firstSendAt', v_job.first_send_at);
end;
$function$;

create or replace function public.luxe_email_settle(
  p_id uuid, p_lease_token uuid, p_outcome text, p_provider_id text,
  p_error_code text, p_retry_after integer default 0
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
  v_job luxe_private.notification_email_outbox%rowtype;
  v_state text;
  v_delay integer;
begin
  if p_id is null or p_lease_token is null or p_outcome is null
    or p_outcome not in ('accepted', 'retry', 'failed', 'needs_review')
    or p_retry_after is null or p_retry_after < 0 or p_retry_after > 86400
    or (p_error_code is not null and p_error_code !~ '^[a-z][a-z0-9_]{0,63}$')
    or (p_error_code is not null and p_error_code not in (
      'idempotency_window_expired', 'invalid_frozen_payload', 'provider_outcome_uncertain',
      'provider_rate_limited', 'provider_unavailable', 'provider_request_in_progress',
      'provider_configuration', 'provider_validation', 'provider_rejected'))
    or (p_outcome = 'accepted' and (p_provider_id is null
      or p_provider_id !~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      or p_error_code is not null))
    or (p_outcome <> 'accepted' and (p_provider_id is not null or p_error_code is null)) then
    raise sqlstate 'PT400' using message = 'Invalid email settlement.';
  end if;
  select * into v_job from luxe_private.notification_email_outbox where id = p_id for update;
  if not found then raise sqlstate 'PT409' using message = 'Worker lease is no longer current.'; end if;
  if v_job.state <> 'leased' and v_job.last_lease_token = p_lease_token
    and v_job.last_outcome = p_outcome
    and v_job.provider_id is not distinct from p_provider_id::uuid
    and v_job.last_error_code is not distinct from p_error_code then
    return pg_catalog.jsonb_build_object('state', v_job.state);
  end if;
  if v_job.state <> 'leased' or v_job.lease_token <> p_lease_token or v_job.lease_until <= v_now then
    raise sqlstate 'PT409' using message = 'Worker lease is no longer current.';
  end if;
  if p_outcome = 'accepted' and v_job.payload is null then
    raise sqlstate 'PT409' using message = 'Email must be prepared before acceptance.';
  end if;
  v_state := p_outcome;
  if p_outcome = 'retry' and (v_job.attempts >= 5
      or v_job.first_send_at <= v_now - interval '23 hours') then
    v_state := 'needs_review';
  end if;
  v_delay := greatest(p_retry_after, case v_job.attempts
    when 1 then 60 when 2 then 300 when 3 then 1800 else 7200 end);
  update luxe_private.notification_email_outbox set state = v_state,
    lease_token = null, lease_until = null, last_lease_token = p_lease_token,
    last_outcome = p_outcome, provider_id = p_provider_id::uuid,
    last_error_code = p_error_code,
    next_attempt_at = case when v_state = 'retry' then v_now + v_delay * interval '1 second'
      else next_attempt_at end, updated_at = v_now where id = p_id;
  -- 'sent' is the legacy lead field: it means provider accepted, NOT delivered.
  update luxe_private.leads set notification_status = case
    when v_state = 'accepted' then 'sent' when v_state = 'retry' then 'pending' else 'failed' end
    where id = v_job.lead_id;
  return pg_catalog.jsonb_build_object('state', v_state);
end;
$function$;

create or replace function public.luxe_email_readiness()
returns jsonb language sql stable security definer set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object('schemaVersion', '1');
$function$;

create or replace function public.luxe_inbox_notifications(p_actor uuid)
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
  return pg_catalog.jsonb_build_object('summary', (select pg_catalog.jsonb_build_object(
    'pending', pg_catalog.count(*) filter (where state in ('pending', 'leased')),
    'retrying', pg_catalog.count(*) filter (where state = 'retry'),
    'accepted', pg_catalog.count(*) filter (where state = 'accepted'),
    'failed', pg_catalog.count(*) filter (where state = 'failed'),
    'needsReview', pg_catalog.count(*) filter (where state = 'needs_review'),
    'expired', pg_catalog.count(*) filter (where state = 'expired'))
    from luxe_private.notification_email_outbox),
    'items', coalesce((select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'id', q.id, 'reference', l.reference, 'state', q.state, 'attempts', q.attempts,
      'createdAt', q.created_at, 'updatedAt', q.updated_at, 'nextAttemptAt', q.next_attempt_at,
      'lastErrorCode', q.last_error_code, 'providerId', q.provider_id)
      order by q.created_at desc, q.id desc)
      from (select * from luxe_private.notification_email_outbox
        order by created_at desc, id desc limit 50) q
      join luxe_private.leads l on l.id = q.lead_id), '[]'::jsonb));
end;
$function$;

revoke all on function public.luxe_email_claim(uuid),
  public.luxe_email_prepare(uuid, uuid, jsonb, integer),
  public.luxe_email_settle(uuid, uuid, text, text, text, integer),
  public.luxe_email_readiness(), public.luxe_inbox_notifications(uuid)
  from public, anon, authenticated, service_role;
grant execute on function public.luxe_email_claim(uuid),
  public.luxe_email_prepare(uuid, uuid, jsonb, integer),
  public.luxe_email_settle(uuid, uuid, text, text, text, integer),
  public.luxe_email_readiness(), public.luxe_inbox_notifications(uuid) to service_role;

commit;
