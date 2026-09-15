alter table public.youtube_quota_usage enable row level security;
revoke execute on function public.reserve_youtube_quota(integer, integer) from public, anon, authenticated;
grant execute on function public.reserve_youtube_quota(integer, integer) to service_role;
