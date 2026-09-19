-- Only expose signal rows whose pool record has a second observation and
-- whose signal was computed at or after that refreshed observation.
drop materialized view if exists public.feed_rankings;

create materialized view public.feed_rankings as
with latest as (
  select max(s.observed_at) as observed_at
  from public.discovery_signals s
),
ranked as (
  select
    s.video_id,
    s.channel_id,
    p.region,
    p.topic,
    p.category_id,
    p.format,
    s.signal_type,
    s.signal_labels,
    s.momentum_score,
    s.observed_at,
    s.expires_at,
    row_number() over (
      order by s.momentum_score desc nulls last, s.video_id
    ) as global_rank
  from public.discovery_signals s
  join public.youtube_discovery_pool p on p.id = s.video_id
  cross join latest l
  where l.observed_at is not null
    and s.observed_at = l.observed_at
    and p.stats_refreshed_at is not null
    and s.observed_at >= p.stats_refreshed_at
)
select * from ranked;