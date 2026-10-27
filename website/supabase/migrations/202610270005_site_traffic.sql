-- PRIVATE SITE TRAFFIC SETUP. Run after migrations 001 through 004.
-- Run the complete setup file as database owner in a fresh SQL Editor query.
-- This never visits a website, sends an alert, changes a lead or enables tracking.
-- Keep luxe_private outside exposed schemas. Capture is server-only; the server
-- must supply a daily keyed HMAC, never a raw address, user agent or full URL.
begin;

create or replace function luxe_private.traffic_pages()
returns text[]
language sql
immutable
set search_path = ''
as $function$
  select array['/', '/about', '/services', '/contact', '/privacy', '/how-it-works',
    '/design-ideas', '/projects', '/testimonials', '/find-your-style', '/materials',
    '/guides', '/guides/first-design-conversation', '/guides/compare-interior-quotes',
    '/guides/plan-your-kitchen', '/guides/renovation-priorities', '/plan',
    '/partner-with-us', '/estimate', '/callback', '/project-brief', '/offers',
    '/my-inspiration', '/reimagine', '/design-ideas/kitchen', '/design-ideas/living',
    '/design-ideas/bedroom', '/design-ideas/wardrobe', '/design-ideas/dining',
    '/design-ideas/bathroom', '/design-ideas/kids', '/design-ideas/office',
    '/design-ideas/pooja', '/design-ideas/foyer', '/design-ideas/full-home']::text[];
$function$;
revoke all on function luxe_private.traffic_pages() from public, anon, authenticated, service_role;

create table if not exists luxe_private.traffic_daily (
  day date primary key,
  page_views integer not null default 0 check (page_views between 0 and 10000),
  visitor_days integer not null default 0 check (visitor_days between 0 and page_views)
);

-- The deduplication ledger carries no address/hash, page, source or device.
create table if not exists luxe_private.traffic_events (
  id uuid primary key,
  day date not null,
  created_at timestamptz not null
);
create index if not exists traffic_events_day_idx on luxe_private.traffic_events (day);

-- Daily hashes cannot be used as a stable identifier across days. Retained only
-- for bounded counting/rate limiting and the approximate recent-visitor figure.
create table if not exists luxe_private.traffic_visitors (
  day date not null,
  visitor_hash text not null check (visitor_hash ~ '^[0-9a-f]{64}$'),
  page_views integer not null check (page_views between 1 and 100),
  last_seen_at timestamptz not null,
  primary key (day, visitor_hash)
);
create index if not exists traffic_visitors_recent_idx
  on luxe_private.traffic_visitors (last_seen_at desc);

create table if not exists luxe_private.traffic_dimensions (
  day date not null references luxe_private.traffic_daily (day) on delete cascade,
  dimension text not null check (dimension in ('page', 'source', 'device')),
  bucket text not null,
  page_views integer not null check (page_views between 1 and 10000),
  primary key (day, dimension, bucket),
  constraint traffic_dimension_bucket check (
    (dimension = 'page' and bucket = any(luxe_private.traffic_pages()))
    or (dimension = 'source' and bucket in ('direct', 'google', 'bing', 'instagram',
      'facebook', 'pinterest', 'youtube', 'linkedin', 'referral'))
    or (dimension = 'device' and bucket in ('desktop', 'mobile', 'tablet', 'other')))
);

alter table luxe_private.traffic_daily enable row level security;
alter table luxe_private.traffic_events enable row level security;
alter table luxe_private.traffic_visitors enable row level security;
alter table luxe_private.traffic_dimensions enable row level security;
revoke all on schema luxe_private from public, anon, authenticated, service_role;
revoke all on table luxe_private.traffic_daily, luxe_private.traffic_events,
  luxe_private.traffic_visitors, luxe_private.traffic_dimensions
  from public, anon, authenticated, service_role;

create or replace function public.luxe_traffic_capture(
  p_id uuid, p_visitor_hash text, p_page text, p_source text, p_device text, p_daily_limit integer
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_now timestamptz;
  v_day date;
  v_views integer;
  v_visitor_views integer;
  v_new_visitor boolean;
begin
  if p_id is null or p_visitor_hash is null or p_visitor_hash !~ '^[0-9a-f]{64}$'
    or p_page is null or not (p_page = any(luxe_private.traffic_pages()))
    or p_source is null or p_source not in ('direct', 'google', 'bing', 'instagram',
      'facebook', 'pinterest', 'youtube', 'linkedin', 'referral')
    or p_device is null or p_device not in ('desktop', 'mobile', 'tablet', 'other')
    or p_daily_limit is null or p_daily_limit < 1 or p_daily_limit > 10000 then
    raise sqlstate 'PT400' using message = 'Invalid traffic event.';
  end if;

  -- One distinct lock protects deduplication, retention and both quotas. It does
  -- not acquire or change the enquiry/intake, membership or email-worker locks.
  perform pg_catalog.pg_advisory_xact_lock(1728045811, 5);
  v_now := pg_catalog.clock_timestamp();
  v_day := (v_now at time zone 'Asia/Kolkata')::date;

  -- Seven IST calendar days of short-lived identifiers and ninety aggregate
  -- days. Cleanup happens on capture, including a duplicate/quota-limited hit;
  -- no lead, member, notification or audit record is touched.
  delete from luxe_private.traffic_events where day < v_day - 6;
  delete from luxe_private.traffic_visitors where day < v_day - 6;
  delete from luxe_private.traffic_daily where day < v_day - 89;

  if exists (select 1 from luxe_private.traffic_events where id = p_id) then
    return pg_catalog.jsonb_build_object('recorded', false);
  end if;
  insert into luxe_private.traffic_daily (day) values (v_day) on conflict (day) do nothing;
  select page_views into v_views from luxe_private.traffic_daily where day = v_day;
  select page_views into v_visitor_views from luxe_private.traffic_visitors
    where day = v_day and visitor_hash = p_visitor_hash;
  v_new_visitor := not found;
  if v_views >= p_daily_limit or coalesce(v_visitor_views, 0) >= 100 then
    return pg_catalog.jsonb_build_object('recorded', false);
  end if;

  insert into luxe_private.traffic_events (id, day, created_at) values (p_id, v_day, v_now);
  insert into luxe_private.traffic_visitors (day, visitor_hash, page_views, last_seen_at)
    values (v_day, p_visitor_hash, 1, v_now)
    on conflict (day, visitor_hash) do update
      set page_views = luxe_private.traffic_visitors.page_views + 1, last_seen_at = excluded.last_seen_at;
  update luxe_private.traffic_daily set page_views = page_views + 1,
    visitor_days = visitor_days + case when v_new_visitor then 1 else 0 end where day = v_day;
  insert into luxe_private.traffic_dimensions (day, dimension, bucket, page_views)
    values (v_day, 'page', p_page, 1), (v_day, 'source', p_source, 1), (v_day, 'device', p_device, 1)
    on conflict (day, dimension, bucket) do update
      set page_views = luxe_private.traffic_dimensions.page_views + 1;
  return pg_catalog.jsonb_build_object('recorded', true);
end;
$function$;

create or replace function public.luxe_inbox_traffic(p_actor uuid, p_days integer)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $function$
declare
  v_actor jsonb;
  v_now timestamptz := pg_catalog.statement_timestamp();
  v_day date := (v_now at time zone 'Asia/Kolkata')::date;
  v_from date;
  v_from_time timestamptz;
  v_result jsonb;
begin
  v_actor := luxe_private.inbox_actor(p_actor);
  if v_actor->>'role' <> 'owner' then
    raise sqlstate 'PT403' using message = 'Owner access is required for site traffic.';
  end if;
  if p_days is null or p_days not in (7, 30, 90) then
    raise sqlstate 'PT400' using message = 'Invalid traffic period.';
  end if;
  v_from := v_day - (p_days - 1);
  v_from_time := v_from::timestamp at time zone 'Asia/Kolkata';

  with days as (
    select v_from + i as day from pg_catalog.generate_series(0, p_days - 1) i
  ), selected_daily as materialized (
    select * from luxe_private.traffic_daily where day between v_from and v_day
  ), selected_leads as materialized (
    select (created_at at time zone 'Asia/Kolkata')::date as day
      from luxe_private.leads where created_at >= v_from_time and created_at <= v_now
  ), selected_dimensions as materialized (
    select dimension, bucket, pg_catalog.sum(page_views)::integer as page_views
      from luxe_private.traffic_dimensions where day between v_from and v_day
      group by dimension, bucket
  )
  select pg_catalog.jsonb_build_object('enabled', true, 'days', p_days,
    'timeZone', 'Asia/Kolkata', 'asOf', v_now, 'from', v_from, 'through', v_day,
    'summary', pg_catalog.jsonb_build_object(
      'pageViews', coalesce((select pg_catalog.sum(page_views) from selected_daily), 0),
      'visitorDays', coalesce((select pg_catalog.sum(visitor_days) from selected_daily), 0),
      'recentVisitors', (select pg_catalog.count(*) from luxe_private.traffic_visitors
        where day between v_day - 1 and v_day and last_seen_at > v_now - interval '15 minutes'
          and last_seen_at <= v_now),
      'leads', (select pg_catalog.count(*) from selected_leads)),
    'daily', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object(
      'date', d.day, 'pageViews', coalesce(t.page_views, 0), 'visitorDays', coalesce(t.visitor_days, 0),
      'leads', (select pg_catalog.count(*) from selected_leads l where l.day = d.day)) order by d.day)
      from days d left join selected_daily t on t.day = d.day),
    'pages', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('page', p.page,
      'pageViews', coalesce(s.page_views, 0)) order by coalesce(s.page_views, 0) desc, p.page)
      from pg_catalog.unnest(luxe_private.traffic_pages()) p(page)
      left join selected_dimensions s on s.dimension = 'page' and s.bucket = p.page),
    'sources', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('source', b.bucket,
      'pageViews', coalesce(s.page_views, 0)) order by b.position)
      from pg_catalog.unnest(array['direct', 'google', 'bing', 'instagram', 'facebook',
        'pinterest', 'youtube', 'linkedin', 'referral']) with ordinality b(bucket, position)
      left join selected_dimensions s on s.dimension = 'source' and s.bucket = b.bucket),
    'devices', (select pg_catalog.jsonb_agg(pg_catalog.jsonb_build_object('device', b.bucket,
      'pageViews', coalesce(s.page_views, 0)) order by b.position)
      from pg_catalog.unnest(array['desktop', 'mobile', 'tablet', 'other']) with ordinality b(bucket, position)
      left join selected_dimensions s on s.dimension = 'device' and s.bucket = b.bucket))
  into v_result;
  return v_result;
end;
$function$;

create or replace function public.luxe_traffic_readiness()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $function$
  select pg_catalog.jsonb_build_object('schemaVersion', '1');
$function$;

revoke all on function public.luxe_traffic_capture(uuid, text, text, text, text, integer),
  public.luxe_inbox_traffic(uuid, integer), public.luxe_traffic_readiness()
  from public, anon, authenticated, service_role;
grant execute on function public.luxe_traffic_capture(uuid, text, text, text, text, integer),
  public.luxe_inbox_traffic(uuid, integer), public.luxe_traffic_readiness() to service_role;

commit;
