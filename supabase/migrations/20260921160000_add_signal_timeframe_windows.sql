-- RALLIVIO signal timeframe windows.
-- Counts stay database-side and feeds return only the small UI slice.

create index if not exists discovery_signals_observed_momentum_idx
  on public.discovery_signals (observed_at desc, momentum_score desc nulls last);

create index if not exists discovery_signals_signal_observed_momentum_idx
  on public.discovery_signals (signal_type, observed_at desc, momentum_score desc nulls last);

create or replace function public.get_discovery_timeframe_signal_counts(p_since timestamptz)
returns jsonb
language sql
security definer
set search_path = public
as $$
  select coalesce(
    jsonb_object_agg(signal_type, signal_count),
    '{}'::jsonb
  )
  from (
    select signal_type, count(distinct video_id)::bigint as signal_count
    from public.discovery_signals
    where observed_at >= p_since
    group by signal_type
  ) grouped;
$$;

revoke execute on function public.get_discovery_timeframe_signal_counts(timestamptz) from public, anon, authenticated;
grant execute on function public.get_discovery_timeframe_signal_counts(timestamptz) to service_role;


create or replace function public.get_discovery_timeframe_metrics(p_since timestamptz)
returns jsonb
language sql
security definer
set search_path = public
as $$
  with observed as (
    select distinct on (ds.video_id)
      ds.video_id,
      ds.channel_id,
      ds.signal_type,
      ds.observed_at,
      yp.topic
    from public.discovery_signals ds
    left join public.youtube_discovery_pool yp on yp.id = ds.video_id
    where ds.observed_at >= p_since
    order by ds.video_id, ds.observed_at desc
  ),
  metrics as (
    select
      count(*)::bigint as verified_signals,
      count(distinct channel_id)::bigint as tracked_creators,
      count(distinct case when signal_type in ('Now Moving','Breaking Out','On the Rise') then channel_id end)::bigint as rising_creators,
      count(distinct nullif(topic,''))::bigint as active_topics
    from observed
  )
  select jsonb_build_object(
    'verifiedSignals', verified_signals,
    'trackedCreators', tracked_creators,
    'risingCreators', rising_creators,
    'activeTopics', active_topics
  )
  from metrics;
$$;

revoke execute on function public.get_discovery_timeframe_metrics(timestamptz) from public, anon, authenticated;
grant execute on function public.get_discovery_timeframe_metrics(timestamptz) to service_role;
