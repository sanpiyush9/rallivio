create or replace function public.get_recent_video_snapshots(p_video_ids text[])
returns table (
  video_id text,
  captured_at timestamptz,
  views bigint,
  likes bigint,
  comments bigint
)
language sql
stable
set search_path = ''
as $$
  select s.video_id, s.captured_at, s.views, s.likes, s.comments
  from (
    select
      v.video_id,
      v.captured_at,
      v.views,
      v.likes,
      v.comments,
      row_number() over (
        partition by v.video_id
        order by v.captured_at desc
      ) as rn
    from public.video_stats_snapshots v
    where v.video_id = any(p_video_ids)
  ) s
  where s.rn <= 5
  order by s.captured_at desc;
$$;

revoke execute on function public.get_recent_video_snapshots(text[]) from public, anon, authenticated;
grant execute on function public.get_recent_video_snapshots(text[]) to service_role;
