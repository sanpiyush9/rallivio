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
