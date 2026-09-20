alter table public.promotion_campaigns
  add column if not exists youtube_video_id text,
  add column if not exists youtube_channel_id text,
  add column if not exists impressions bigint not null default 0,
  add column if not exists clicks bigint not null default 0,
  add column if not exists last_distributed_at timestamptz;

create index if not exists promotion_campaigns_video_idx
  on public.promotion_campaigns(youtube_video_id)
  where youtube_video_id is not null;

create index if not exists promotion_campaigns_active_video_idx
  on public.promotion_campaigns(status, youtube_video_id)
  where status = 'active' and youtube_video_id is not null;
