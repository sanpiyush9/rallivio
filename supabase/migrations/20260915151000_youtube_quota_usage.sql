create table if not exists public.youtube_quota_usage (
  usage_date date primary key,
  total_units integer not null default 0,
  search_calls integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.reserve_youtube_quota(p_units integer, p_search_calls integer default 0)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date date := (now() at time zone 'UTC')::date;
  v_total integer;
  v_search integer;
begin
  insert into public.youtube_quota_usage (usage_date) values (v_date)
  on conflict (usage_date) do nothing;
  select total_units, search_calls into v_total, v_search
  from public.youtube_quota_usage where usage_date = v_date for update;
  if v_total + p_units > 10000 or v_search + p_search_calls > 60 then
    return false;
  end if;
  update public.youtube_quota_usage
    set total_units = v_total + p_units,
        search_calls = v_search + p_search_calls,
        updated_at = now()
  where usage_date = v_date;
  return true;
end;
$$;
