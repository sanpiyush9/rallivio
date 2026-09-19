-- Reconciles the live percentile-based observation-tier function into repository migration history.
-- The live database already contains the tier columns and supporting indexes.
-- HOT is the top 10% acceleration candidate within topic, capped to 5% globally.
-- WARM occupies the next activity band up to 25% cumulative; ARCHIVE is reserved for
-- genuinely stale/no-movement rows.

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
    select max(observed_at) as observed_at
    from public.discovery_signals
  ),
  metrics as (
    select
      p.id,
      coalesce(p.topic, 'Other') as topic,
      coalesce((s.evidence->>'acceleration')::double precision, 0) as acceleration,
      coalesce((s.evidence->>'velocity')::double precision, 0) as velocity,
      coalesce(s.momentum_score, 0) as momentum,
      s.observed_at as signal_observed_at
    from public.youtube_discovery_pool p
    left join public.discovery_signals s
      on s.video_id = p.id
     and s.observed_at = (select observed_at from latest)
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
    select *,
      ceil(total_count * 0.05)::integer as hot_limit,
      ceil(total_count * 0.25)::integer as warm_limit
    from ranked
  ),
  updates as (
    update public.youtube_discovery_pool p
    set
      tier = case
        when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 'hot'
        when c.global_activity_row <= c.warm_limit then 'warm'
        when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 'archive'
        else 'cold'
      end,
      observation_priority = case
        when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 100
        when c.global_activity_row <= c.warm_limit then 50
        when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 0
        else 10
      end,
      tier_changed_at = case
        when p.tier is distinct from case
          when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 'hot'
          when c.global_activity_row <= c.warm_limit then 'warm'
          when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 'archive'
          else 'cold'
        end then now()
        else p.tier_changed_at
      end,
      promotion_reason = case
        when c.topic_accel_rank <= 0.10 and c.global_accel_row <= c.hot_limit then 'top 10% acceleration within topic; capped at global 5%'
        when c.global_activity_row <= c.warm_limit then 'top 25% global activity after HOT allocation'
        when p.last_movement_at is not null and p.last_movement_at < now() - interval '30 days' then 'no movement for 30 days'
        else 'baseline observation tier'
      end,
      last_observed_at = coalesce(c.signal_observed_at, p.last_observed_at)
    from classified c
    where p.id = c.id
    returning p.id
  )
  select count(*) into total_videos from updates;

  hot_cap := ceil(total_videos * 0.05)::integer;
  warm_cap := ceil(total_videos * 0.25)::integer;

  select jsonb_build_object(
    'updated', total_videos,
    'hot_cap', hot_cap,
    'warm_cap', warm_cap,
    'hot', count(*) filter (where tier = 'hot'),
    'warm', count(*) filter (where tier = 'warm'),
    'cold', count(*) filter (where tier = 'cold'),
    'archive', count(*) filter (where tier = 'archive'),
    'total', count(*)
  ) into result
  from public.youtube_discovery_pool;

  return result;
end;
$function$;
