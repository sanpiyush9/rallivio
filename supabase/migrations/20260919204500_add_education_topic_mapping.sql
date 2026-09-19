-- Add explicit Education keyword mapping to the RALLIVIO topic taxonomy.
update public.youtube_discovery_pool
set topic = 'Education'
where lower(coalesce(title,'') || ' ' || coalesce(description,'')) ~ '\\m(education|educational|tutorial|course|lesson|learn|learning|study|exam|school|university|college)\\M'
  and topic not in ('Food','Fitness','Podcasts','Finance','Business','Science','Beauty','Fashion','DIY & Home','AI & Tech','Travel');