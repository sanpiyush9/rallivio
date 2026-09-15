-- RALLIVIO Phase 0 data foundation
create table if not exists public.channel_stats (
  channel_id text not null,
  captured_at timestamptz not null default now(),
  subscriber_count bigint not null default 0,
  video_count integer not null default 0,
  category_bucket text not null default 'Technology',
  primary key (channel_id, captured_at)
);

create index if not exists channel_stats_channel_captured_idx on public.channel_stats (channel_id, captured_at desc);

create table if not exists public.discovery_signals (
  id uuid primary key default gen_random_uuid(),
  channel_id text not null,
  video_id text,
  signal_type text not null,
  momentum_score numeric,
  evidence jsonb not null default '{}'::jsonb,
  cell_key text not null,
  observed_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists discovery_signals_current_idx on public.discovery_signals (cell_key, signal_type, observed_at desc);
create index if not exists discovery_signals_channel_idx on public.discovery_signals (channel_id, observed_at desc);

create table if not exists public.weekly_creator_rankings (
  week_start date not null,
  channel_id text not null,
  rank integer not null,
  momentum_score numeric not null,
  evidence jsonb not null default '{}'::jsonb,
  notable_video_id text,
  computed_at timestamptz not null default now(),
  primary key (week_start, channel_id),
  unique (week_start, rank)
);
create index if not exists weekly_creator_rankings_week_rank_idx on public.weekly_creator_rankings (week_start, rank);

create table if not exists public.click_attribution (
  click_id uuid primary key default gen_random_uuid(),
  video_id text,
  channel_id text not null,
  source_page text not null,
  clicked_at timestamptz not null default now()
);
create index if not exists click_attribution_channel_idx on public.click_attribution (channel_id, clicked_at desc);

create table if not exists public.system_health (
  check_name text primary key,
  status text not null,
  value jsonb not null default '{}'::jsonb,
  threshold jsonb not null default '{}'::jsonb,
  checked_at timestamptz not null default now()
);

create table if not exists public.relaxation_log (
  request_id uuid primary key default gen_random_uuid(),
  requested_intent jsonb not null,
  relaxations_applied jsonb not null default '[]'::jsonb,
  final_state jsonb not null,
  served_at timestamptz not null default now()
);

alter table public.youtube_discovery_pool enable row level security;
alter table public.video_stats_snapshots enable row level security;
alter table public.channel_stats enable row level security;
alter table public.discovery_signals enable row level security;
alter table public.weekly_creator_rankings enable row level security;
alter table public.click_attribution enable row level security;
alter table public.discovery_pool_health enable row level security;
alter table public.system_health enable row level security;
alter table public.relaxation_log enable row level security;

drop policy if exists "Public can read verified discovery pool" on public.youtube_discovery_pool;
create policy "Public can read verified discovery pool" on public.youtube_discovery_pool for select to public using (verified_at <= now() and (expires_at is null or expires_at > now()));

drop policy if exists "Public can read current signals" on public.discovery_signals;
create policy "Public can read current signals" on public.discovery_signals for select to public using (expires_at is null or expires_at > now());

drop policy if exists "Public can read weekly rankings" on public.weekly_creator_rankings;
create policy "Public can read weekly rankings" on public.weekly_creator_rankings for select to public using (true);
