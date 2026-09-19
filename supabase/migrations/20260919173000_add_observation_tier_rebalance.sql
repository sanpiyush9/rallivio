create or replace function public.rebalance_youtube_observation_tiers()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
begin
  with latest as (
    select distinct on (video_id)
      video_id, momentum_score, evidence, observed_at
    from public.discovery_signals
    order by video_id, observed_at desc, momentum_score desc nulls last
  ),
  classified as (
    select
      p.id,
      case
        when p.published_at >= now() - interval '48 hours'
          or coalesce(l.momentum_score, 0) >= 55
          or coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 45 then 'hot'
        when p.published_at >= now() - interval '7 days'
          or coalesce(l.momentum_score, 0) >= 35
          or coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 20 then 'warm'
        when coalesce(p.last_movement_at, p.last_seen_at, p.updated_at) < now() - interval '30 days' then 'archive'
        else 'cold'
      end as tier,
      coalesce(l.observed_at, p.stats_refreshed_at, p.last_seen_at, p.updated_at) as observed_at,
      case
        when coalesce(l.momentum_score, 0) >= 55 then 100
        when coalesce(l.momentum_score, 0) >= 35 then 60
        else 20
      end as priority,
      case
        when coalesce(l.momentum_score, 0) >= 55 then 'momentum'
        when coalesce((l.evidence ->> 'acceleration')::numeric, 0) >= 45 then 'acceleration'
        when p.published_at >= now() - interval '48 hours' then 'recent'
        else null
      end as reason
    from public.youtube_discovery_pool p
    left join latest l on l.video_id = p.id
  )
  update public.youtube_discovery_pool p
  set
    tier = c.tier,
    last_observed_at = c.observed_at,
    last_movement_at = case
      when c.tier in ('hot','warm') then coalesce(c.observed_at, p.last_movement_at)
      else p.last_movement_at
    end,
    tier_changed_at = case
      when p.tier is distinct from c.tier then now()
      else p.tier_changed_at
    end,
    observation_priority = c.priority,
    promotion_reason = c.reason
  from classified c
  where p.id = c.id;

  select jsonb_build_object(
    'hot', count(*) filter (where tier = 'hot'),
    'warm', count(*) filter (where tier = 'warm'),
    'cold', count(*) filter (where tier = 'cold'),
    'archive', count(*) filter (where tier = 'archive'),
    'total', count(*)
  )
  into result
  from public.youtube_discovery_pool;

  return result;
end;
$$;

revoke execute on function public.rebalance_youtube_observation_tiers() from public, anon, authenticated;
grant execute on function public.rebalance_youtube_observation_tiers() to service_role;
