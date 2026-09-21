-- RALLIVIO Embed distribution request accounting.
create table if not exists public.embed_request_log (
  source_host text not null,
  window_start timestamptz not null,
  request_count integer not null default 0,
  last_seen_at timestamptz not null default now(),
  primary key (source_host, window_start)
);
create index if not exists embed_request_log_last_seen_idx on public.embed_request_log(last_seen_at desc);
alter table public.embed_request_log enable row level security;
revoke all on public.embed_request_log from public, anon, authenticated;

create or replace function public.consume_embed_request(p_source_host text)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  bucket timestamptz := date_trunc('hour',now());
  next_count integer;
begin
  insert into public.embed_request_log(source_host,window_start,request_count,last_seen_at)
  values(left(coalesce(nullif(trim(p_source_host),''),'direct'),253),bucket,1,now())
  on conflict(source_host,window_start) do update
    set request_count=public.embed_request_log.request_count+1,last_seen_at=now()
  returning request_count into next_count;
  return next_count;
end;
$$;
revoke execute on function public.consume_embed_request(text) from public,anon,authenticated;
grant execute on function public.consume_embed_request(text) to service_role;
