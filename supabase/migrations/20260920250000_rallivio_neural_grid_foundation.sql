-- RALLIVIO Neural Grid foundation: adaptive unknown state, entity intelligence,
-- deterministic anomaly detection, and a durable event bus for video/creator/topic/region changes.

alter table public.youtube_discovery_pool
  alter column tier set default 'unknown';

drop constraint if exists youtube_discovery_pool_tier_check on public.youtube_discovery_pool;
alter table public.youtube_discovery_pool
  add constraint youtube_discovery_pool_tier_check
  check (tier in ('unknown','hot','warm','cold','archive'));

create index if not exists youtube_pool_unknown_observation_idx
  on public.youtube_discovery_pool (tier, next_observation_at, created_at)
  where tier = 'unknown';

create table if not exists public.discovery_creator_intelligence (
  channel_id text primary key,
  video_count integer not null default 0,
  signal_count integer not null default 0,
  current_views bigint not null default 0,
  current_velocity numeric not null default 0,
  current_acceleration numeric not null default 0,
  momentum_score numeric,
  anomaly_score numeric not null default 0,
  breakout_state text not null default 'stable',
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.discovery_topic_intelligence (
  topic text not null,
  region text not null,
  format text not null,
  video_count integer not null default 0,
  signal_count integer not null default 0,
  current_velocity numeric not null default 0,
  current_acceleration numeric not null default 0,
  anomaly_score numeric not null default 0,
  breakout_state text not null default 'stable',
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (topic, region, format)
);

create table if not exists public.discovery_region_intelligence (
  region text primary key,
  video_count integer not null default 0,
  signal_count integer not null default 0,
  current_velocity numeric not null default 0,
  current_acceleration numeric not null default 0,
  anomaly_score numeric not null default 0,
  breakout_state text not null default 'stable',
  evidence jsonb not null default '{}'::jsonb,
  observed_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.discovery_signal_events
  add column if not exists event_type text not null default 'VideoSignalChanged',
  add column if not exists entity_type text not null default 'video',
  add column if not exists entity_id text;

update public.discovery_signal_events
set entity_id = video_id
where entity_id is null;

create index if not exists discovery_signal_events_entity_time_idx
  on public.discovery_signal_events (entity_type, entity_id, observed_at desc);

create index if not exists discovery_creator_intelligence_momentum_idx
  on public.discovery_creator_intelligence (momentum_score desc nulls last, anomaly_score desc);
create index if not exists discovery_topic_intelligence_activity_idx
  on public.discovery_topic_intelligence (anomaly_score desc, current_velocity desc);
create index if not exists discovery_region_intelligence_activity_idx
  on public.discovery_region_intelligence (anomaly_score desc, current_velocity desc);

alter table public.discovery_creator_intelligence enable row level security;
alter table public.discovery_topic_intelligence enable row level security;
alter table public.discovery_region_intelligence enable row level security;

revoke all on public.discovery_creator_intelligence from public, anon, authenticated;
revoke all on public.discovery_topic_intelligence from public, anon, authenticated;
revoke all on public.discovery_region_intelligence from public, anon, authenticated;
grant select on public.discovery_creator_intelligence to service_role;
grant select on public.discovery_topic_intelligence to service_role;
grant select on public.discovery_region_intelligence to service_role;

create or replace function public.recompute_discovery_intelligence()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  now_ts timestamptz := now();
  creators integer := 0;
  topics integer := 0;
  regions integer := 0;
begin
  -- Creator intelligence is deliberately deterministic. It compares the latest
  -- observed signal features against the creator's own current distribution.
  truncate public.discovery_creator_intelligence;
  insert into public.discovery_creator_intelligence
    (channel_id, video_count, signal_count, current_views, current_velocity,
     current_acceleration, momentum_score, anomaly_score, breakout_state,
     evidence, observed_at, updated_at)
  with latest as (
    select distinct on (video_id) video_id, momentum_score, evidence, observed_at
    from public.discovery_signals
    order by video_id, observed_at desc, id desc
  ),
  grouped as (
    select p.channel_id,
      count(*) as video_count,
      count(l.video_id) as signal_count,
      coalesce(sum(p.views),0) as current_views,
      coalesce(avg((l.evidence->>'velocity')::numeric),0) as velocity,
      coalesce(avg((l.evidence->>'acceleration')::numeric),0) as acceleration,
      avg(l.momentum_score) as momentum
    from public.youtube_discovery_pool p
    left join latest l on l.video_id = p.id
    where p.tier <> 'archive'
    group by p.channel_id
  ),
  scored as (
    select g.*,
      least(100.0, greatest(0.0,
        (g.velocity * 0.45 + g.acceleration * 0.35 + coalesce(g.momentum,0) * 0.20)
      )) as activity,
      percent_rank() over (order by g.velocity desc) as velocity_rank
    from grouped g
  )
  select channel_id, video_count, signal_count, current_views,
    round(velocity,2), round(acceleration,2), round(coalesce(momentum,0),2),
    round((1 - velocity_rank) * 100,2),
    case
      when velocity_rank <= 0.05 or acceleration >= 60 then 'breakout'
      when velocity_rank <= 0.20 or acceleration >= 35 then 'rising'
      else 'stable'
    end,
    jsonb_build_object('activityScore',round(activity,2),'velocityPercentile',round((1-velocity_rank)::numeric,4)),
    now_ts, now_ts
  from scored;
  get diagnostics creators = row_count;

  truncate public.discovery_topic_intelligence;
  insert into public.discovery_topic_intelligence
    (topic, region, format, video_count, signal_count, current_velocity,
     current_acceleration, anomaly_score, breakout_state, evidence, observed_at, updated_at)
  with latest as (
    select distinct on (video_id) video_id, momentum_score, evidence
    from public.discovery_signals
    order by video_id, observed_at desc, id desc
  ), grouped as (
    select coalesce(p.topic,'Other') topic, coalesce(p.region,'WORLDWIDE') region,
      coalesce(p.format,'video') format, count(*) video_count,
      count(l.video_id) signal_count,
      coalesce(avg((l.evidence->>'velocity')::numeric),0) velocity,
      coalesce(avg((l.evidence->>'acceleration')::numeric),0) acceleration
    from public.youtube_discovery_pool p
    left join latest l on l.video_id=p.id
    where p.tier <> 'archive'
    group by 1,2,3
  ), scored as (
    select g.*, percent_rank() over (order by g.velocity desc) velocity_rank
    from grouped g
  )
  select topic, region, format, video_count, signal_count,
    round(velocity,2), round(acceleration,2), round((1-velocity_rank)*100,2),
    case when velocity_rank <= 0.05 or acceleration >= 60 then 'breakout'
         when velocity_rank <= 0.20 or acceleration >= 35 then 'rising'
         else 'stable' end,
    jsonb_build_object('velocityPercentile',round((1-velocity_rank)::numeric,4)),
    now_ts, now_ts
  from scored;
  get diagnostics topics = row_count;

  truncate public.discovery_region_intelligence;
  insert into public.discovery_region_intelligence
    (region, video_count, signal_count, current_velocity, current_acceleration,
     anomaly_score, breakout_state, evidence, observed_at, updated_at)
  with latest as (
    select distinct on (video_id) video_id, evidence
    from public.discovery_signals
    order by video_id, observed_at desc, id desc
  ), grouped as (
    select coalesce(p.region,'WORLDWIDE') region, count(*) video_count,
      count(l.video_id) signal_count,
      coalesce(avg((l.evidence->>'velocity')::numeric),0) velocity,
      coalesce(avg((l.evidence->>'acceleration')::numeric),0) acceleration
    from public.youtube_discovery_pool p
    left join latest l on l.video_id=p.id
    where p.tier <> 'archive'
    group by 1
  ), scored as (
    select g.*, percent_rank() over (order by g.velocity desc) velocity_rank
    from grouped g
  )
  select region, video_count, signal_count, round(velocity,2), round(acceleration,2),
    round((1-velocity_rank)*100,2),
    case when velocity_rank <= 0.05 or acceleration >= 60 then 'breakout'
         when velocity_rank <= 0.20 or acceleration >= 35 then 'rising'
         else 'stable' end,
    jsonb_build_object('velocityPercentile',round((1-velocity_rank)::numeric,4)),
    now_ts, now_ts
  from scored;
  get diagnostics regions = row_count;

  insert into public.discovery_signal_events
    (video_id, channel_id, from_signal, to_signal, signal_labels, momentum_score,
     evidence, observed_at, event_type, entity_type, entity_id)
  select null, null, null, c.breakout_state, '[]'::jsonb, c.momentum_score,
    c.evidence, c.observed_at,
    case when c.breakout_state='breakout' then 'CreatorBreakout'
         when c.breakout_state='rising' then 'CreatorRising'
         else 'CreatorStateChanged' end,
    'creator', c.channel_id
  from public.discovery_creator_intelligence c
  where c.breakout_state in ('breakout','rising')
    and c.updated_at = now_ts;

  return jsonb_build_object('creators',creators,'topics',topics,'regions',regions,'observedAt',now_ts);
end;
$$;

revoke all on function public.recompute_discovery_intelligence() from public, anon, authenticated;
grant execute on function public.recompute_discovery_intelligence() to service_role;

create or replace function public.run_discovery_signal_cycle()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  recomputed jsonb;
  rebalanced jsonb;
  intelligence jsonb;
begin
  recomputed := public.recompute_discovery_signals();
  select public.rebalance_youtube_observation_tiers() into rebalanced;
  intelligence := public.recompute_discovery_intelligence();
  perform public.refresh_discovery_feed_rankings();
  return jsonb_build_object(
    'recomputed', recomputed,
    'rebalanced', rebalanced,
    'intelligence', intelligence,
    'feedRefreshed', true,
    'ranAt', now()
  );
end;
$$;

revoke all on function public.run_discovery_signal_cycle() from public, anon, authenticated;
grant execute on function public.run_discovery_signal_cycle() to service_role;
