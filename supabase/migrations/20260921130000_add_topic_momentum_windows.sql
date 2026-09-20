create or replace function public.get_topic_momentum_windows(
  p_topics text[] default null,
  p_windows integer default 12
)
returns table (
  topic text,
  window_start timestamptz,
  momentum numeric,
  video_count integer
)
language sql
stable
security definer
set search_path = public
as $function$
  with hourly as (
    select date_trunc('hour', s.captured_at) as window_start, s.video_id, max(s.views) as views
    from public.video_stats_snapshots s
    where s.captured_at >= now() - interval '48 hours'
    group by 1, 2
  ),
  stepped as (
    select h.*, lag(h.window_start) over (partition by h.video_id order by h.window_start) as previous_window,
           lag(h.views) over (partition by h.video_id order by h.window_start) as previous_views
    from hourly h
  ),
  deltas as (
    select s.window_start, p.topic, s.video_id,
           greatest(0, s.views - coalesce(s.previous_views, s.views))::numeric as view_delta
    from stepped s
    join public.youtube_discovery_pool p on p.id = s.video_id
    where p.topic is not null
      and (s.previous_window is null or s.window_start - s.previous_window <= interval '2 hours')
      and (p_topics is null or p.topic = any(p_topics))
  ),
  aggregated as (
    select d.topic, d.window_start, sum(d.view_delta) as momentum, count(distinct d.video_id)::integer as video_count
    from deltas d group by d.topic, d.window_start
  ),
  recent_windows as (
    select distinct window_start from aggregated
    order by window_start desc
    limit greatest(1, least(p_windows, 24))
  )
  select a.topic, a.window_start, a.momentum, a.video_count
  from aggregated a join recent_windows r using (window_start)
  order by a.topic, a.window_start;
$function$;

revoke all on function public.get_topic_momentum_windows(text[], integer) from public, anon, authenticated;
grant execute on function public.get_topic_momentum_windows(text[], integer) to service_role;
