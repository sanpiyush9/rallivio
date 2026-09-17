# YouTube Discovery Checkpoint — 2026-09-18

**Workstream:** YouTube discovery intelligence  
**QA branch:** `feature/creator-platform-subscription`  
**Production/main:** untouched

## Correct product interpretation

The Creator page and the YouTube platform/discovery page are different layers.

- Creator page = one creator identity, platform switching, creator metrics, subscription analytics, history and opportunities.
- YouTube page = live YouTube discovery surface with player, side queue, topic/format/region controls and RALLIVIO trend signals.

The YouTube discovery surface should answer:

> What is moving, where is it moving, who is emerging, what is breaking out, what is under the radar, and why is it getting attention?

## Implemented

`app/platform/youtube/page.tsx`

- Live YouTube player with embeddable playback and source link fallback.
- Side video queue with clickable video selection.
- Topic/category selector.
- Video format selector: all, short-form, long-form, live.
- Viewer region selector with manual country choices.
- Search for topic/video/creator/idea.
- RALLIVIO signal selector.
- Signal groups: Breaking Out, On the Rise, Under the Radar, Newcomer Rising, Now Moving, Live.
- Transparent "Why is this moving?" explanation for selected videos.
- Momentum score derived from observable public source fields.
- Views, velocity, engagement, audience-relative performance and creator-stage indicators.
- Responsive desktop/mobile composition.
- YouTube source/compliance messaging and direct source links.

`app/api/youtube/trending/route.ts`

- Uses `videos.list` with `chart=mostPopular` for the low-cost trend candidate pool when no keyword search is requested.
- Uses `search.list` only for explicit keyword/topic searches.
- Fetches video statistics/content details and public channel statistics.
- Computes RALLIVIO signal explanations without presenting them as official YouTube rankings.
- Uses viewer-region information from Vercel request headers when the caller requests auto region.
- Handles unsupported regional/category charts by falling back to the regional most-popular pool and filtering the requested category when possible.
- Never fabricates results when the source returns none.

## Important YouTube API architecture

The default discovery path must not call `search.list` for every RALLIVIO user action. YouTube's current API documentation states that `videos.list` costs 1 quota unit, while `search.list` is separately quota-controlled; default project allocation is documented as 10,000 units/day for the other endpoints and 100 `search.list` calls/day under the current quota model. citehttps://developers.google.com/youtube/v3/getting-started

The long-term RALLIVIO architecture therefore remains:

`YouTube ingestion -> verified RALLIVIO data layer -> snapshots/index -> discovery intelligence -> users`

User-facing RALLIVIO search/discovery should increasingly read from the RALLIVIO index rather than creating a fresh YouTube `search.list` call for every user query.

## Important API limitation

As of July 21, 2025, YouTube changed the `videos.list` `mostPopular` chart: it no longer represents the old YouTube Trending Now page and instead reflects Trending Music, Movies and Gaming charts. RALLIVIO must therefore treat `mostPopular` as a source candidate pool, then apply its own transparent discovery signals; it must not label the API response as YouTube's official universal Trending Now ranking. citehttps://developers.google.com/youtube/v3/revision_history

## QA deployment evidence

The latest implementation deployment for this checkpoint is on the Creator QA branch only. The build compiled successfully and Vercel reported deployment completion for commit `82dfb087fdd8e01997e5302db28c20a184309007` before this documentation commit.

After this document commit, rerun the standard deployment gate:

1. exact branch SHA
2. Vercel READY
3. public preview URL
4. `/platform/youtube`
5. `/api/youtube/trending`
6. player/embed
7. side queue
8. topic/filter/format/region changes
9. search behavior
10. signal explanations
11. no fake data / no production changes

## Next intelligence layer

The current "why" explanation is a verified snapshot explanation. It is not yet true historical acceleration because that requires RALLIVIO snapshots over time.

Next:

- persist periodic video/channel snapshots
- calculate 1h/6h/24h/7d acceleration
- compare against creator audience baselines
- detect breakout trajectory rather than only current velocity
- build cross-topic and cross-region trend graphs
- add personalized radar
- feed the same verified dataset into Discover and Creator intelligence
- add controlled ingestion/caching so user demand does not multiply YouTube quota usage
