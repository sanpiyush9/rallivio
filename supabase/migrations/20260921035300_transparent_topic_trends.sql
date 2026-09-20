-- RALLIVIO discovery trend methodology
-- Uses comparable hourly view velocity, median aggregation, and a continuity gate.
-- A topic trend is published only when the latest continuous run contains
-- at least 6 hourly windows with >=20 observed videos per window.

create or replace function public.get_topic_momentum_windows(p_topics text[] default null, p_windows integer default 12)
returns table(topic text, window_start timestamptz, momentum numeric, video_count integer)
language sql
stable
as $$
with hourly as (
  select date_trunc('hour', s.captured_at) as window_start, s.video_id, max(s.views)::numeric as views
  from public.video_stats_snapshots s
  where s.captured_at >= now() - interval '48 hours'
  group by 1, 2
),
stepped as (
  select h.*,
    lag(h.window_start) over (partition by h.video_id order by h.window_start) as previous_window,
    lag(h.views) over (partition by h.video_id order by h.window_start) as previous_views
  from hourly h
),
deltas as (
  select s.window_start, p.topic, s.video_id,
    greatest(0, s.views - s.previous_views)
      / greatest(extract(epoch from (s.window_start - s.previous_window)) / 3600.0, 1.0) as hourly_view_velocity
  from stepped s
  join public.youtube_discovery_pool p on p.id = s.video_id
  where p.topic is not null
    and s.previous_window is not null
    and s.window_start - s.previous_window <= interval '2 hours'
    and (p_topics is null or p.topic = any(p_topics))
),
aggregated as (
  select d.topic, d.window_start,
    percentile_cont(0.5) within group (order by d.hourly_view_velocity)::numeric as momentum,
    count(distinct d.video_id)::integer as video_count
  from deltas d
  group by d.topic, d.window_start
  having count(distinct d.video_id) >= 20
),
window_gaps as (
  select a.*,
    lag(a.window_start) over (partition by a.topic order by a.window_start) as previous_topic_window
  from aggregated a
),
runs as (
  select w.*,
    sum(case when w.previous_topic_window is null or w.window_start - w.previous_topic_window > interval '2 hours' then 1 else 0 end)
      over (partition by w.topic order by w.window_start) as run_id
  from window_gaps w
),
latest_runs as (
  select topic, run_id, max(window_start) as latest_window, count(*)::integer as run_windows
  from runs
  group by topic, run_id
),
selected_runs as (
  select lr.topic, lr.run_id
  from latest_runs lr
  where lr.run_windows >= 6
),
recent_windows as (
  select r.topic, r.window_start, r.momentum, r.video_count,
    row_number() over (partition by r.topic order by r.window_start desc) as rn
  from runs r
  join selected_runs sr on sr.topic = r.topic and sr.run_id = r.run_id
)
select topic, window_start, momentum, video_count
from recent_windows
where rn <= greatest(1, least(coalesce(p_windows, 12), 24))
order by topic, window_start;
$$;
