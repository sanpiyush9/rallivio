-- Keep discovery feed rankings queryable at scale and refreshable from the worker.
-- The unique video_id index also enables future CONCURRENTLY refreshes.

create unique index if not exists feed_rankings_video_id_uidx
  on public.feed_rankings (video_id);

create index if not exists feed_rankings_signal_labels_gin_idx
  on public.feed_rankings using gin (signal_labels jsonb_path_ops);

create or replace function public.refresh_discovery_feed_rankings()
returns void
language plpgsql
security definer
set search_path = ''
as $function$
begin
  refresh materialized view public.feed_rankings;
end;
$function$;

revoke execute on function public.refresh_discovery_feed_rankings() from public, anon, authenticated;
grant execute on function public.refresh_discovery_feed_rankings() to service_role;
