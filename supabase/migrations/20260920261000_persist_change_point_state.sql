create or replace function public.apply_discovery_change_point()
returns trigger
language plpgsql
as $$
declare
  cp jsonb;
begin
  cp := public.compute_change_point_score(new.current_velocity, new.current_acceleration, new.anomaly_score);
  new.change_point_score := (cp->>'score')::numeric;
  new.change_state := cp->>'state';
  return new;
end;
$$;

drop trigger if exists discovery_creator_change_point on public.discovery_creator_intelligence;
create trigger discovery_creator_change_point
before insert or update of current_velocity, current_acceleration, anomaly_score
on public.discovery_creator_intelligence
for each row execute function public.apply_discovery_change_point();

drop trigger if exists discovery_topic_change_point on public.discovery_topic_intelligence;
create trigger discovery_topic_change_point
before insert or update of current_velocity, current_acceleration, anomaly_score
on public.discovery_topic_intelligence
for each row execute function public.apply_discovery_change_point();

drop trigger if exists discovery_region_change_point on public.discovery_region_intelligence;
create trigger discovery_region_change_point
before insert or update of current_velocity, current_acceleration, anomaly_score
on public.discovery_region_intelligence
for each row execute function public.apply_discovery_change_point();
