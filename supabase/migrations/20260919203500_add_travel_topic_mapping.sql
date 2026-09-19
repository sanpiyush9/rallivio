-- Add explicit Travel keyword mapping to the RALLIVIO topic taxonomy.
update public.youtube_discovery_pool
set topic = 'Travel'
where lower(coalesce(title,'') || ' ' || coalesce(description,'')) ~ '\\m(travel|tourism|vacation|holiday|trip|itinerary|destination|hotel review|travel vlog)\\M'
  and topic not in ('Food','Fitness','Podcasts','Finance','Business','Science','Beauty','Fashion','DIY & Home','AI & Tech');