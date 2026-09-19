-- Normalize discovery data to RALLIVIO dimensions and invalidate
-- signal metadata that is not backed by a second observation.

update public.youtube_discovery_pool p
set
  topic = case
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(food|recipe|cooking|cook|restaurant|cuisine|baking|chef|meal|street food)\\M' then 'Food'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(fitness|workout|gym|exercise|yoga|weight loss|bodybuilding|training)\\M' then 'Fitness'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(podcast|podcasts|interview show)\\M' then 'Podcasts'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(finance|investing|investment|stocks|stock market|trading|crypto|mutual fund|banking)\\M' then 'Finance'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(business|startup|entrepreneur|marketing|sales|founder|small business)\\M' then 'Business'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(science|physics|chemistry|biology|space|astronomy|research|experiment)\\M' then 'Science'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(beauty|makeup|skincare|cosmetics|haircare|hair style)\\M' then 'Beauty'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(fashion|outfit|clothing|streetwear|fashion haul)\\M' then 'Fashion'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(diy|do it yourself|home decor|home improvement|craft|woodworking|interior design)\\M' then 'DIY & Home'
    when lower(coalesce(p.title,'') || ' ' || coalesce(p.description,'')) ~ '\\m(programming|software|coding|developer|technology|tech|ai|artificial intelligence|machine learning|gadget|smartphone|computer)\\M' then 'AI & Tech'
    when coalesce(p.metadata->>'category_id','') = '1' then 'Entertainment'
    when coalesce(p.metadata->>'category_id','') = '2' then 'Automotive'
    when coalesce(p.metadata->>'category_id','') = '10' then 'Music'
    when coalesce(p.metadata->>'category_id','') = '15' then 'Pets'
    when coalesce(p.metadata->>'category_id','') = '17' then 'Sports'
    when coalesce(p.metadata->>'category_id','') = '19' then 'Travel'
    when coalesce(p.metadata->>'category_id','') = '20' then 'Gaming'
    when coalesce(p.metadata->>'category_id','') = '22' then 'Lifestyle'
    when coalesce(p.metadata->>'category_id','') = '23' then 'Comedy'
    when coalesce(p.metadata->>'category_id','') = '24' then 'Entertainment'
    when coalesce(p.metadata->>'category_id','') = '25' then 'News'
    when coalesce(p.metadata->>'category_id','') = '26' then 'DIY & Home'
    when coalesce(p.metadata->>'category_id','') = '27' then 'Education'
    when coalesce(p.metadata->>'category_id','') = '28' then 'AI & Tech'
    when coalesce(p.metadata->>'category_id','') = '29' then 'News'
    else 'Entertainment'
  end,
  format = case
    when live_broadcast_content = 'live' then 'live'
    when coalesce(nullif(duration,''),'PT0S') ~ '^PT(?:(\\d+)H)?(?:(\\d+)M)?(?:(\\d+)S)?$'
      and (
        coalesce((substring(duration from '^PT(?:(\\d+)H)')::int),0) * 3600 +
        coalesce((substring(duration from '^PT(?:\\d+H)?(?:(\\d+)M)')::int),0) * 60 +
        coalesce((substring(duration from '^PT(?:\\d+H)?(?:\\d+M)?(?:(\\d+)S)')::int),0)
      ) < 60 then 'short'
    else 'video'
  end,
  metadata = metadata - 'signal' - 'momentum_score' - 'signals';

delete from public.discovery_signals s
using public.youtube_discovery_pool p
where p.id = s.video_id
  and (p.stats_refreshed_at is null or s.observed_at < p.stats_refreshed_at);

update public.youtube_discovery_pool
set metadata = jsonb_set(
  jsonb_set(coalesce(metadata,'{}'::jsonb), '{signal}', 'null'::jsonb, true),
  '{momentum_score}', 'null'::jsonb, true
)
where stats_refreshed_at is null;

refresh materialized view public.feed_rankings;
