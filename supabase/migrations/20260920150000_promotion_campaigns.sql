create table if not exists public.promotion_campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  source_url text not null,
  source_host text not null,
  content_type text not null default 'link' check (content_type in ('youtube_video','youtube_channel','website','article','product','brand','social','music','app','link')),
  title text,
  status text not null default 'draft' check (status in ('draft','active','paused','completed','blocked')),
  distribution_mode text not null default 'rallivio_owned' check (distribution_mode in ('rallivio_owned','authorized_external','paid')),
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  started_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists promotion_campaigns_user_idx on public.promotion_campaigns(user_id, created_at desc);
create index if not exists promotion_campaigns_status_idx on public.promotion_campaigns(status, updated_at desc);
alter table public.promotion_campaigns enable row level security;
drop policy if exists "users can read own promotion campaigns" on public.promotion_campaigns;
create policy "users can read own promotion campaigns" on public.promotion_campaigns for select to authenticated using ((select auth.uid()) = user_id);
drop policy if exists "users can create own promotion campaigns" on public.promotion_campaigns;
create policy "users can create own promotion campaigns" on public.promotion_campaigns for insert to authenticated with check ((select auth.uid()) = user_id);
drop policy if exists "users can update own promotion campaigns" on public.promotion_campaigns;
create policy "users can update own promotion campaigns" on public.promotion_campaigns for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create or replace function public.set_promotion_campaign_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists promotion_campaigns_updated_at on public.promotion_campaigns;
create trigger promotion_campaigns_updated_at before update on public.promotion_campaigns for each row execute function public.set_promotion_campaign_updated_at();