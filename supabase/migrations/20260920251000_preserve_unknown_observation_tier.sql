-- Preserve UNKNOWN until a candidate has enough observations to classify it.
-- This prevents a first observation from being mislabeled as COLD/HOT and makes
-- the adaptive scheduler's uncertainty explicit.

create or replace function public.rebalance_youtube_observation_tiers()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  total_videos integer := 0;
  hot_cap integer := 0;
  warm_cap integer := 0;
  result jsonb;
begin
  with latest as (
    select max(observed_at) as observed_at from public.discovery_signals
  ),
  observation_counts as (
    select video_id, count(*) as observations
    from public.video_stats_snapshots
    group by video_id
  ),
  metrics as (
    select p.id,
      coalesce(p.topic, 'Other') as topic,
      coalesce((s.evidence->>'acceleration')::double precision, 0) as acceleration,
      coalesce((s.evidence->>'velocity')::double precision, 0) as velocity,
      coalesce(s.momentum_score, 0) as momentum,
      coalesce(o.observations,0) as observations,
      s.observed_at as signal_observed_at
    from public.youtube_discovery_pool p
    left join public.discovery_signals s
      on s.video_id = p.id and s.observed_at = (select observed_at from latest)
    left join observation_counts o on o.video_id = p.id
  ),
  ranked as (
    select *,
      percent_rank() over (partition by topic order by acceleration desc, id) as topic_accel_rank,
      row_number() over (order by acceleration desc, id) as global_accel_row,
      row_number() over (order by greatest(acceleration, velocity, momentum) desc, id) as global_activity_row,
      count(*) over () as total_count
    from metrics
  ),
  classified as (
    select *, ceil(total_count * 0.05)::integer hot_limit,
      ceil(total_count * 0.25)::integer warm_limit
    from ranked
  ),
  updates as (
    update public.youtube_discovery_pool p
    set tier = case
        when c.observations < 2 then 'unknown'
        when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 'hot'
        when c.global_activity_row <= c.warm_limit then 'warm'
        when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 'archive'
        else 'cold'
      end,
      observation_priority = case
        when c.observations < 2 then 80
        when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 100
        when c.global_activity_row <= c.warm_limit then 50
        when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 0
        else 10 end,
      tier_changed_at = case
        when p.tier is distinct from case
          when c.observations < 2 then 'unknown'
          when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 'hot'
          when c.global_activity_row <= c.warm_limit then 'warm'
          when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 'archive'
          else 'cold' end then now() else p.tier_changed_at end,
      promotion_reason = case
        when c.observations < 2 then 'awaiting second observation'
        when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 'top 10% acceleration within topic; capped at global 5%'
        when c.global_activity_row <= c.warm_limit then 'top 25% global activity after HOT allocation'
        when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 'no movement for 30 days'
        else 'baseline observation tier' end,
      last_observed_at = coalesce(c.signal_observed_at, p.last_observed_at)
    from classified c where p.id = c.id
    returning p.id
  ) select count(*) into total_videos from updates;

  hot_cap := ceil(total_videos * 0.05)::integer;
  warm_cap := ceil(total_videos * 0.25)::integer;

  select jsonb_build_object(
    'updated', total_videos,
    'hot_cap', hot_cap,
    'warm_cap', warm_cap,
    'hot', count(*) filter (where tier='hot'),
    'warm', count(*) filter (where tier='warm'),
    'cold', count(*) filter (where tier='cold'),
    'unknown', count(*) filter (where tier='unknown'),
    'archive', count(*) filter (where tier='archive'),
    'total', count(*)
  ) into result from public.youtube_discovery_pool;
  return result;
end;
$function$;
