create table if not exists public.discovery_source_registry (
  source_id text primary key,
  display_name text not null,
  source_kind text not null,
  enabled boolean not null default false,
  official_api boolean not null default false,
  attribution_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.discovery_source_registry
  (source_id, display_name, source_kind, enabled, official_api, attribution_url, notes)
values
  ('youtube', 'YouTube Data API', 'video', true, true, 'https://developers.google.com/youtube/v3', 'Primary official discovery/statistics source.'),
  ('rss', 'Approved RSS feeds', 'feed', false, false, null, 'Adapter boundary exists; enable only for feeds whose publisher permits automated use.')
on conflict (source_id) do update set
  display_name = excluded.display_name,
  source_kind = excluded.source_kind,
  official_api = excluded.official_api,
  attribution_url = excluded.attribution_url,
  notes = excluded.notes,
  updated_at = now();

alter table public.discovery_creator_intelligence
  add column if not exists change_point_score numeric not null default 0,
  add column if not exists change_state text not null default 'stable';

alter table public.discovery_topic_intelligence
  add column if not exists change_point_score numeric not null default 0,
  add column if not exists change_state text not null default 'stable';

alter table public.discovery_region_intelligence
  add column if not exists change_point_score numeric not null default 0,
  add column if not exists change_state text not null default 'stable';

create or replace function public.compute_change_point_score(
  p_current_velocity numeric,
  p_current_acceleration numeric,
  p_anomaly_score numeric
)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'score',
      round(least(100::numeric, greatest(0::numeric,
        coalesce(p_anomaly_score, 0) * 60
        + greatest(coalesce(p_current_acceleration, 0), 0) * 0.4
        + greatest(coalesce(p_current_velocity, 0), 0) * 0.2
      )), 2),
    'state',
      case
        when (
          coalesce(p_anomaly_score, 0) >= 0.75
          or coalesce(p_current_acceleration, 0) >= 50
        ) then 'change_point'
        when (
          coalesce(p_anomaly_score, 0) >= 0.45
          or coalesce(p_current_acceleration, 0) >= 25
        ) then 'watch'
        else 'stable'
      end
  );
$$;

update public.discovery_creator_intelligence
set
  change_point_score = ((public.compute_change_point_score(current_velocity, current_acceleration, anomaly_score)->>'score')::numeric),
  change_state = public.compute_change_point_score(current_velocity, current_acceleration, anomaly_score)->>'state';

update public.discovery_topic_intelligence
set
  change_point_score = ((public.compute_change_point_score(current_velocity, current_acceleration, anomaly_score)->>'score')::numeric),
  change_state = public.compute_change_point_score(current_velocity, current_acceleration, anomaly_score)->>'state';

update public.discovery_region_intelligence
set
  change_point_score = ((public.compute_change_point_score(current_velocity, current_acceleration, anomaly_score)->>'score')::numeric),
  change_state = public.compute_change_point_score(current_velocity, current_acceleration, anomaly_score)->>'state';

alter table public.discovery_source_registry enable row level security;
drop policy if exists discovery_source_registry_public_read on public.discovery_source_registry;
create policy discovery_source_registry_public_read
  on public.discovery_source_registry
  for select
  to anon, authenticated
  using (enabled = true);

revoke all on public.discovery_source_registry from anon, authenticated;
grant select on public.discovery_source_registry to anon, authenticated;
