-- Keep signal recomputation independent from the web deployment scheduler.
-- Supabase Cron runs the database-side intelligence cycle every 10 minutes.

create or replace function public.run_discovery_signal_cycle()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  recomputed jsonb;
  rebalanced jsonb;
begin
  recomputed := public.recompute_discovery_signals();
  select public.rebalance_youtube_observation_tiers() into rebalanced;
  perform public.refresh_discovery_feed_rankings();
  return jsonb_build_object(
    'recomputed', recomputed,
    'rebalanced', rebalanced,
    'feedRefreshed', true,
    'ranAt', now()
  );
end;
$$;

revoke all on function public.run_discovery_signal_cycle() from public, anon, authenticated;
grant execute on function public.run_discovery_signal_cycle() to service_role;

select cron.schedule(
  'rallivio-discovery-signal-cycle',
  '*/10 * * * *',
  'select public.run_discovery_signal_cycle();'
)
where not exists (
  select 1 from cron.job where jobname = 'rallivio-discovery-signal-cycle'
);