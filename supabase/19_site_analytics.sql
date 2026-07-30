-- Analytics de acesso da loja (first-party, LGPD via consentimento no app)
-- Visitas, sessões, presença em tempo real e agregações para o admin.

create table if not exists public.site_page_views (
  id bigint generated always as identity primary key,
  visitor_id uuid not null,
  session_id uuid not null,
  path text not null,
  referrer_host text not null default '',
  device_type text not null default 'desktop'
    check (device_type in ('mobile', 'tablet', 'desktop')),
  created_at timestamptz not null default now()
);

create index if not exists site_page_views_created_at_idx
  on public.site_page_views (created_at desc);
create index if not exists site_page_views_visitor_created_idx
  on public.site_page_views (visitor_id, created_at desc);
create index if not exists site_page_views_session_created_idx
  on public.site_page_views (session_id, created_at desc);
create index if not exists site_page_views_path_created_idx
  on public.site_page_views (path, created_at desc);

create table if not exists public.site_visitor_presence (
  visitor_id uuid primary key,
  session_id uuid not null,
  path text not null default '/',
  device_type text not null default 'desktop'
    check (device_type in ('mobile', 'tablet', 'desktop')),
  last_seen_at timestamptz not null default now()
);

create index if not exists site_visitor_presence_last_seen_idx
  on public.site_visitor_presence (last_seen_at desc);

alter table public.site_page_views enable row level security;
alter table public.site_visitor_presence enable row level security;
-- Sem policies públicas — leitura/escrita só via service_role + RPCs

create or replace function private.site_analytics_range_bounds(
  p_range text,
  out p_start timestamptz,
  out p_end timestamptz,
  out p_prev_start timestamptz,
  out p_prev_end timestamptz
)
language plpgsql
stable
as $$
declare
  v_today date := (timezone('America/Sao_Paulo', now()))::date;
  v_start date;
  v_end_exclusive date;
  v_days integer;
begin
  case lower(coalesce(p_range, 'today'))
    when 'today' then
      v_start := v_today;
      v_end_exclusive := v_today + 1;
    when 'yesterday' then
      v_start := v_today - 1;
      v_end_exclusive := v_today;
    when '7d' then
      v_start := v_today - 6;
      v_end_exclusive := v_today + 1;
    when '30d' then
      v_start := v_today - 29;
      v_end_exclusive := v_today + 1;
    when 'month' then
      v_start := date_trunc('month', v_today)::date;
      v_end_exclusive := v_today + 1;
    else
      raise exception 'Intervalo inválido';
  end case;

  p_start := (v_start::timestamp at time zone 'America/Sao_Paulo');
  p_end := (v_end_exclusive::timestamp at time zone 'America/Sao_Paulo');
  v_days := greatest(v_end_exclusive - v_start, 1);
  p_prev_end := p_start;
  p_prev_start := p_start - make_interval(days => v_days);
end;
$$;

create or replace function public.record_site_analytics_event(
  p_visitor_id uuid,
  p_session_id uuid,
  p_path text,
  p_referrer_host text default '',
  p_device_type text default 'desktop',
  p_kind text default 'pageview'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_path text := left(coalesce(nullif(trim(p_path), ''), '/'), 300);
  v_referrer text := left(coalesce(p_referrer_host, ''), 120);
  v_device text := case
    when p_device_type in ('mobile', 'tablet', 'desktop') then p_device_type
    else 'desktop'
  end;
  v_kind text := lower(coalesce(p_kind, 'pageview'));
begin
  if p_visitor_id is null or p_session_id is null then
    raise exception 'visitor/session obrigatórios';
  end if;

  if v_kind = 'pageview' then
    insert into public.site_page_views (
      visitor_id, session_id, path, referrer_host, device_type
    ) values (
      p_visitor_id, p_session_id, v_path, v_referrer, v_device
    );
  elsif v_kind <> 'heartbeat' then
    raise exception 'tipo de evento inválido';
  end if;

  insert into public.site_visitor_presence (
    visitor_id, session_id, path, device_type, last_seen_at
  ) values (
    p_visitor_id, p_session_id, v_path, v_device, now()
  )
  on conflict (visitor_id) do update set
    session_id = excluded.session_id,
    path = excluded.path,
    device_type = excluded.device_type,
    last_seen_at = now();
end;
$$;

create or replace function public.admin_site_analytics(
  p_range text default 'today'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_start timestamptz;
  v_end timestamptz;
  v_prev_start timestamptz;
  v_prev_end timestamptz;
  v_active_now integer;
  v_unique integer;
  v_views integer;
  v_sessions integer;
  v_prev_unique integer;
  v_prev_views integer;
  v_prev_sessions integer;
  v_series jsonb;
  v_top_pages jsonb;
  v_devices jsonb;
  v_referrers jsonb;
  v_live_paths jsonb;
begin
  select * into v_start, v_end, v_prev_start, v_prev_end
  from private.site_analytics_range_bounds(p_range);

  select count(*)::integer
  into v_active_now
  from public.site_visitor_presence
  where last_seen_at >= now() - interval '5 minutes';

  select
    count(distinct visitor_id)::integer,
    count(*)::integer,
    count(distinct session_id)::integer
  into v_unique, v_views, v_sessions
  from public.site_page_views
  where created_at >= v_start and created_at < v_end;

  select
    count(distinct visitor_id)::integer,
    count(*)::integer,
    count(distinct session_id)::integer
  into v_prev_unique, v_prev_views, v_prev_sessions
  from public.site_page_views
  where created_at >= v_prev_start and created_at < v_prev_end;

  with days as (
    select generate_series(
      date_trunc('day', v_start at time zone 'America/Sao_Paulo'),
      date_trunc('day', (v_end - interval '1 second') at time zone 'America/Sao_Paulo'),
      interval '1 day'
    )::date as day
  ),
  agg as (
    select
      (created_at at time zone 'America/Sao_Paulo')::date as day,
      count(distinct visitor_id)::integer as unique_visitors,
      count(*)::integer as page_views
    from public.site_page_views
    where created_at >= v_start and created_at < v_end
    group by 1
  )
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'date', to_char(d.day, 'YYYY-MM-DD'),
        'uniqueVisitors', coalesce(a.unique_visitors, 0),
        'pageViews', coalesce(a.page_views, 0)
      )
      order by d.day
    ),
    '[]'::jsonb
  )
  into v_series
  from days d
  left join agg a on a.day = d.day;

  select coalesce(
    jsonb_agg(row_to_json(t)::jsonb),
    '[]'::jsonb
  )
  into v_top_pages
  from (
    select
      path,
      count(*)::integer as views,
      count(distinct visitor_id)::integer as unique_visitors
    from public.site_page_views
    where created_at >= v_start and created_at < v_end
    group by path
    order by views desc
    limit 8
  ) t;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'device', device_type,
        'visitors', visitors
      )
      order by visitors desc
    ),
    '[]'::jsonb
  )
  into v_devices
  from (
    select device_type, count(distinct visitor_id)::integer as visitors
    from public.site_page_views
    where created_at >= v_start and created_at < v_end
    group by device_type
  ) d;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'host', nullif(referrer_host, ''),
        'visitors', visitors
      )
      order by visitors desc
    ),
    '[]'::jsonb
  )
  into v_referrers
  from (
    select referrer_host, count(distinct visitor_id)::integer as visitors
    from public.site_page_views
    where created_at >= v_start
      and created_at < v_end
      and referrer_host <> ''
    group by referrer_host
    order by visitors desc
    limit 6
  ) r;

  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'path', path,
        'visitors', visitors
      )
      order by visitors desc
    ),
    '[]'::jsonb
  )
  into v_live_paths
  from (
    select path, count(*)::integer as visitors
    from public.site_visitor_presence
    where last_seen_at >= now() - interval '5 minutes'
    group by path
    order by visitors desc
    limit 5
  ) lp;

  return jsonb_build_object(
    'range', lower(coalesce(p_range, 'today')),
    'timezone', 'America/Sao_Paulo',
    'generatedAt', now(),
    'activeNow', coalesce(v_active_now, 0),
    'uniqueVisitors', coalesce(v_unique, 0),
    'pageViews', coalesce(v_views, 0),
    'sessions', coalesce(v_sessions, 0),
    'pagesPerSession', case
      when coalesce(v_sessions, 0) = 0 then 0
      else round((v_views::numeric / v_sessions::numeric), 2)
    end,
    'previous', jsonb_build_object(
      'uniqueVisitors', coalesce(v_prev_unique, 0),
      'pageViews', coalesce(v_prev_views, 0),
      'sessions', coalesce(v_prev_sessions, 0)
    ),
    'series', coalesce(v_series, '[]'::jsonb),
    'topPages', coalesce(v_top_pages, '[]'::jsonb),
    'devices', coalesce(v_devices, '[]'::jsonb),
    'referrers', coalesce(v_referrers, '[]'::jsonb),
    'livePaths', coalesce(v_live_paths, '[]'::jsonb)
  );
end;
$$;

revoke all on function public.record_site_analytics_event(uuid, uuid, text, text, text, text)
  from public, anon, authenticated;
grant execute on function public.record_site_analytics_event(uuid, uuid, text, text, text, text)
  to service_role;

revoke all on function public.admin_site_analytics(text)
  from public, anon, authenticated;
grant execute on function public.admin_site_analytics(text)
  to service_role;
