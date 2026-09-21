create table if not exists public.promotion_distribution_events (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.promotion_campaigns(id) on delete cascade,
  event_type text not null check (event_type in ('impression','click')),
  publisher_host text,
  publisher_path text,
  referrer text,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_promotion_distribution_events_campaign_created
  on public.promotion_distribution_events(campaign_id, created_at desc);
create index if not exists idx_promotion_distribution_events_campaign_publisher
  on public.promotion_distribution_events(campaign_id, publisher_host);

alter table public.promotion_distribution_events enable row level security;

create or replace function public.record_promotion_event(
  p_campaign_id uuid,
  p_event_type text,
  p_publisher_host text default null,
  p_publisher_path text default null,
  p_referrer text default null,
  p_user_agent text default null
) returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare
  v_campaign public.promotion_campaigns;
begin
  if p_event_type not in ('impression','click') then
    raise exception 'invalid event type';
  end if;

  select * into v_campaign
  from public.promotion_campaigns
  where id = p_campaign_id
    and status = 'active'
    and distribution_mode = 'rallivio_owned'
    and trial_ends_at > now();

  if not found then
    return jsonb_build_object('ok', false, 'state', 'CAMPAIGN_INACTIVE');
  end if;

  insert into public.promotion_distribution_events(
    campaign_id,event_type,publisher_host,publisher_path,referrer,user_agent
  ) values (
    p_campaign_id,p_event_type,
    nullif(left(coalesce(p_publisher_host,''),253),''),
    nullif(left(coalesce(p_publisher_path,''),1000),''),
    nullif(left(coalesce(p_referrer,''),2000),''),
    nullif(left(coalesce(p_user_agent,''),1000),'')
  );

  if p_event_type='impression' then
    update public.promotion_campaigns
      set impressions=coalesce(impressions,0)+1, updated_at=now()
      where id=p_campaign_id;
  else
    update public.promotion_campaigns
      set clicks=coalesce(clicks,0)+1, last_distributed_at=now(), updated_at=now()
      where id=p_campaign_id;
  end if;

  return jsonb_build_object('ok', true);
end;
$$;

grant execute on function public.record_promotion_event(uuid,text,text,text,text,text) to anon, authenticated;