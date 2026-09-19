CREATE OR REPLACE FUNCTION public.recompute_discovery_signals()
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  now_ts timestamptz := now();
  signal_count integer := 0;
  event_count integer := 0;
begin
  create temporary table if not exists _rallivio_signal_rows on commit drop as
  select
    p.id as video_id,
    p.channel_id,
    p.published_at,
    p.live_broadcast_content,
    p.topic,
    p.region,
    p.format,
    p.metadata,
    s.captured_at,
    s.views,
    s.likes,
    s.comments,
    row_number() over (partition by p.id order by s.captured_at desc) as rn_desc
  from public.youtube_discovery_pool p
  join public.video_stats_snapshots s on s.video_id = p.id
  where p.tier <> 'archive'
    and s.captured_at >= now_ts - interval '30 days';

  truncate _rallivio_signal_rows;

  insert into _rallivio_signal_rows
  select
    p.id, p.channel_id, p.published_at, p.live_broadcast_content,
    p.topic, p.region, p.format, p.metadata, s.captured_at,
    s.views, s.likes, s.comments,
    row_number() over (partition by p.id order by s.captured_at desc)
  from public.youtube_discovery_pool p
  join public.video_stats_snapshots s on s.video_id = p.id
  where p.tier <> 'archive'
    and s.captured_at >= now_ts - interval '30 days';

  create temporary table _rallivio_ranked on commit drop as
  with ordered as (
    select r.*,
      lag(
        least(100.0, log(1 + r.views / greatest(
          0.1, extract(epoch from (r.captured_at - r.published_at)) / 3600.0
        )) * 18.0)
      ) over (partition by r.video_id order by r.captured_at) as prev_velocity,
      least(100.0, log(1 + r.views / greatest(
        0.1, extract(epoch from (r.captured_at - r.published_at)) / 3600.0
      )) * 18.0) as velocity
    from _rallivio_signal_rows r
    where r.rn_desc <= 5
  ),
  current_rows as (
    select
      video_id,
      max(channel_id) as channel_id,
      max(published_at) as published_at,
      max(live_broadcast_content) as live_broadcast_content,
      max(topic) as topic,
      max(region) as region,
      max(format) as format,
      (array_agg(metadata order by captured_at desc))[1] as metadata,
      max(captured_at) filter (where rn_desc = 1) as observed_at,
      max(views) filter (where rn_desc = 1) as current_views,
      max(likes) filter (where rn_desc = 1) as current_likes,
      max(comments) filter (where rn_desc = 1) as current_comments,
      min(captured_at) as oldest_observed_at,
      (array_agg(views order by captured_at asc))[1] as oldest_views,
      count(*) as observation_count,
      count(*) filter (
        where rn_desc <= 4
          and prev_velocity is not null
          and velocity > prev_velocity
      ) as rising_steps,
      max(velocity) filter (where rn_desc = 1) as velocity,
      min(velocity) as min_velocity
    from ordered
    group by video_id
  ),
  scored as (
    select c.*,
      least(100.0, greatest(0.0,
        (
          (current_views - coalesce(oldest_views, current_views))
          / greatest(0.1, extract(epoch from (observed_at - oldest_observed_at)) / 3600.0)
          / greatest(
              coalesce(oldest_views, current_views)
              / greatest(0.1, extract(epoch from (oldest_observed_at - published_at)) / 3600.0),
              1
            )
        ) * 30.0
      )) as acceleration,
      least(100.0, ((current_likes + current_comments) / greatest(current_views, 1)) * 2000.0) as engagement,
      least(100.0, log(1 + current_views) * 10.0) as efficiency,
      log(1 + current_views / greatest(
        coalesce((metadata->>'subscriber_count')::numeric, 0) + 1000,
        1000
      )) as audience_relative_score
    from current_rows c
  ),
  with_momentum as (
    select s.*,
      round(greatest(0.0, least(100.0,
        velocity * 0.45 + engagement * 0.15 + efficiency * 0.20 + acceleration * 0.20
      )))::numeric as momentum_score
    from scored s
    where observation_count >= 2 or live_broadcast_content = 'live'
  ),
  ranked as (
    select m.*,
      percent_rank() over (partition by topic, region, format order by velocity desc nulls last) as velocity_rank,
      percent_rank() over (partition by topic, region, format order by acceleration desc nulls last) as acceleration_rank,
      percent_rank() over (partition by topic, region, format order by audience_relative_score asc nulls last) as audience_rank
    from with_momentum m
  )
  select * from ranked;

  delete from public.discovery_signals where observed_at < now_ts;

  insert into public.discovery_signals (
    channel_id, video_id, signal_type, momentum_score, evidence,
    cell_key, observed_at, expires_at, signal_labels
  )
  select
    r.channel_id,
    r.video_id,
    coalesce(
      case
        when r.live_broadcast_content = 'live' and now_ts - r.observed_at <= interval '1 hour' then 'Live'
        when r.observation_count >= 2 and r.acceleration_rank <= 0.10 and now_ts - r.observed_at <= interval '6 hours' then 'Breaking Out'
        when r.observation_count >= 2 and r.velocity_rank <= 0.25 and now_ts - r.observed_at <= interval '6 hours' then 'Now Moving'
        when r.observation_count >= 2 and r.rising_steps >= 3 and now_ts - r.observed_at <= interval '12 hours' then 'On the Rise'
        when r.observation_count >= 2 and r.audience_rank <= 0.10 and now_ts - r.observed_at <= interval '12 hours' then 'Under the Radar'
        when now_ts - r.published_at <= interval '48 hours' and now_ts - r.observed_at <= interval '48 hours' then 'Just Dropped'
        else null
      end, 'Observed'
    ),
    case when r.observation_count >= 2 then r.momentum_score else null end,
    jsonb_build_object(
      'velocity', round(r.velocity)::integer,
      'acceleration', round(r.acceleration)::integer,
      'engagement', round(r.engagement)::integer,
      'efficiency', round(r.efficiency)::integer,
      'observedViews', r.current_views,
      'observationCount', r.observation_count,
      'velocityPercentile', round((1 - r.velocity_rank)::numeric, 4),
      'accelerationPercentile', round((1 - r.acceleration_rank)::numeric, 4),
      'audienceRelativePercentile', round((1 - r.audience_rank)::numeric, 4),
      'audienceRelativeScore', round(r.audience_relative_score::numeric, 4),
      'risingSteps', r.rising_steps,
      'format', r.format
    ),
    concat(r.topic, ':', r.region, ':', r.format),
    now_ts,
    now_ts + interval '6 hours',
    to_jsonb(array_remove(array[
      case when r.live_broadcast_content = 'live' and now_ts - r.observed_at <= interval '1 hour' then 'Live' end,
      case when r.observation_count >= 2 and r.velocity_rank <= 0.25 and now_ts - r.observed_at <= interval '6 hours' then 'Now Moving' end,
      case when r.observation_count >= 2 and r.acceleration_rank <= 0.10 and now_ts - r.observed_at <= interval '6 hours' then 'Breaking Out' end,
      case when r.observation_count >= 2 and r.rising_steps >= 3 and now_ts - r.observed_at <= interval '12 hours' then 'On the Rise' end,
      case when r.observation_count >= 2 and r.audience_rank <= 0.10 and now_ts - r.observed_at <= interval '12 hours' then 'Under the Radar' end,
      case when now_ts - r.published_at <= interval '48 hours' and now_ts - r.observed_at <= interval '48 hours' then 'Just Dropped' end
    ], null))
  from _rallivio_ranked r
  where (r.live_broadcast_content = 'live' and now_ts - r.observed_at <= interval '1 hour')
     or (r.observation_count >= 2 and (
       r.velocity_rank <= 0.25 or r.acceleration_rank <= 0.10 or r.rising_steps >= 3
       or r.audience_rank <= 0.10 or now_ts - r.published_at <= interval '48 hours'
     ));

  get diagnostics signal_count = row_count;

  insert into public.discovery_signal_events (
    video_id, channel_id, from_signal, to_signal, signal_labels,
    momentum_score, evidence, observed_at
  )
  select n.video_id, n.channel_id, prev.to_signal, n.signal_type,
         n.signal_labels, n.momentum_score, n.evidence, n.observed_at
  from public.discovery_signals n
  left join lateral (
    select e.to_signal
    from public.discovery_signal_events e
    where e.video_id = n.video_id
    order by e.observed_at desc, e.id desc
    limit 1
  ) prev on true
  where prev.to_signal is distinct from n.signal_type;

  get diagnostics event_count = row_count;

  update public.youtube_discovery_pool
  set signal_dirty_at = null
  where signal_dirty_at is not null;

  return jsonb_build_object('signals', signal_count, 'events', event_count, 'observedAt', now_ts);
end;
$function$
