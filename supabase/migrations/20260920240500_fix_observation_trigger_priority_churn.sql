-- Do not wake every observation job when a priority value changes.
-- Priority is scheduler metadata; tier transitions are the actual wake-up event.

create or replace function public.enqueue_youtube_observation_job()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    new.next_observation_at := coalesce(new.next_observation_at, now());
  elsif tg_op = 'UPDATE' and new.tier is distinct from old.tier then
    new.next_observation_at := least(coalesce(new.next_observation_at, now()), now());
  end if;
  return new;
end;
$$;

drop trigger if exists youtube_pool_observation_enqueue on public.youtube_discovery_pool;
create trigger youtube_pool_observation_enqueue
before insert or update of tier
on public.youtube_discovery_pool
for each row execute function public.enqueue_youtube_observation_job();