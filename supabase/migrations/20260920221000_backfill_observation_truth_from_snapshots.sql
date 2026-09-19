-- Existing acquisition passes already stored repeated statistics snapshots for the
-- discovery pool. Promote the latest repeated snapshot to the observation-truth
-- timestamp so signal rows can be served without inventing a refresh.
with observation_truth as (
  select video_id, max(captured_at) as latest_observed_at
  from public.video_stats_snapshots
  group by video_id
  having count(distinct captured_at) >= 2
)
update public.youtube_discovery_pool p
set
  stats_refreshed_at = o.latest_observed_at,
  last_observed_at = greatest(coalesce(p.last_observed_at, o.latest_observed_at), o.latest_observed_at)
from observation_truth o
where p.id = o.video_id
  and (p.stats_refreshed_at is null or p.stats_refreshed_at < o.latest_observed_at);

refresh materialized view public.feed_rankings;
