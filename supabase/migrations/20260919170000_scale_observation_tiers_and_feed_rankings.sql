alter table public.youtube_discovery_pool
  add column if not exists tier text not null default 'cold',
  add column if not exists last_observed_at timestamptz,
  add column if not exists last_movement_at timestamptz,
  add column if not exists tier_changed_at timestamptz not null default now(),
  add column if not exists observation_priority integer not null default 0,
  add column if not exists promotion_reason text;

alter table public.youtube_discovery_pool
  drop constraint if exists youtube_discovery_pool_tier_check;

alter table public.youtube_discovery_pool
  add constraint youtube_discovery_pool_tier_check
  check (tier in ('hot','warm','cold','archive'));

create index if not exists youtube_discovery_pool_tier_observed_idx
  on public.youtube_discovery_pool(tier, last_observed_at asc nulls first, updated_at asc);

create index if not exists youtube_discovery_pool_tier_movement_idx
  on public.youtube_discovery_pool(tier, last_movement_at asc nulls first);

create index if not exists youtube_discovery_pool_published_at_idx
  on public.youtube_discovery_pool(published_at desc);

with latest as (
  select distinct on (video_id)
    video_id, momentum_score, evidence, observed_at
  from public.discovery_signals
  order by video_id, observed_at desc, momentum_score desc nulls last
)
update public.youtube_discovery_pool p
set
  tier = case
    when p.published_at >= now() - interval '48 hours'
      or coalesce(l.momentum_score, 0) >= 55
      or coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 45 then 'hot'
    when p.published_at >= now() - interval '7 days'
      or coalesce(l.momentum_score, 0) >= 35
      or coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 20 then 'warm'
    when coalesce(p.last_movement_at, p.last_seen_at, p.updated_at) < now() - interval '30 days' then 'archive'
    else 'cold'
  end,
  last_observed_at = coalesce(p.stats_refreshed_at, p.last_seen_at, p.updated_at),
  last_movement_at = case
    when coalesce(l.momentum_score, 0) >= 35
      or coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 20
      then coalesce(l.observed_at, p.stats_refreshed_at, p.last_seen_at, p.updated_at)
    else p.last_movement_at
  end,
  observation_priority = case
    when coalesce(l.momentum_score, 0) >= 55 then 100
    when coalesce(l.momentum_score, 0) >= 35 then 60
    else 20
  end,
  promotion_reason = case
    when coalesce(l.momentum_score, 0) >= 55 then 'momentum'
    when coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 45 then 'acceleration'
    when p.published_at >= now() - interval '48 hours' then 'recent'
    else null
  end
from latest l
where p.id = l.video_id;

update public.youtube_discovery_pool p
set
  tier = case
    when p.published_at >= now() - interval '48 hours' then 'hot'
    when p.published_at >= now() - interval '7 days' then 'warm'
    when coalesce(p.last_movement_at, p.last_seen_at, p.updated_at) < now() - interval '30 days' then 'archive'
    else 'cold'
  end,
  last_observed_at = coalesce(p.stats_refreshed_at, p.last_seen_at, p.updated_at),
  observation_priority = case
    when p.published_at >= now() - interval '48 hours' then 100
    when p.published_at >= now() - interval '7 days' then 60
    else 20
  end
where not exists (select 1 from public.discovery_signals s where s.video_id = p.id);

drop materialized view if exists public.feed_rankings;

create materialized view public.feed_rankings as
with latest as (
  select max(observed_at) as observed_at from public.discovery_signals
),
ranked as (
  select
    s.video_id, s.channel_id, p.region, p.topic, p.category_id,
    s.signal_type, s.momentum_score, s.observed_at, s.expires_at,
    row_number() over (
      order by s.momentum_score desc nulls last, s.video_id
    )::bigint as global_rank
  from public.discovery_signals s
  left join public.youtube_discovery_pool p on p.id = s.video_id
  cross join latest l
  where l.observed_at is not null and s.observed_at = l.observed_at
)
select * from ranked;

create unique index if not exists feed_rankings_video_id_uidx on public.feed_rankings(video_id);
create index if not exists feed_rankings_global_rank_idx on public.feed_rankings(global_rank);
create index if not exists feed_rankings_region_rank_idx on public.feed_rankings(region, momentum_score desc nulls last);
create index if not exists feed_rankings_topic_rank_idx on public.feed_rankings(topic, momentum_score desc nulls last);

revoke all on public.feed_rankings from public, anon, authenticated;
grant select on public.feed_rankings to service_role;

do $$
declare
  existing_job_id bigint;
begin
  select jobid into existing_job_id from cron.job
  where jobname = 'rallivio-feed-rankings-refresh';
  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;
  perform cron.schedule(
    'rallivio-feed-rankings-refresh',
    '35 * * * *',
    'refresh materialized view public.feed_rankings;'
  );
end
$$;
