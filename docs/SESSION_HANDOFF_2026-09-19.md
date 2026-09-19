# RALLIVIO — Full Session Handoff — 2026-09-19

> Purpose: preserve the complete working context for the next ChatGPT session so the owner does not need to re-explain the project after chat-limit rollover.
> This document is a continuity handoff, not a new canonical specification.

## 1. Project identity

- Repository: `sanpiyush9/rallivio`
- Active branch: `feature/creator-platform-subscription`
- Current implementation/deployment target: RALLIVIO Living Field / YouTube discovery intelligence
- Live Preview:
  https://rallivio-git-feature-creator-platform-subscription-san-eca6.vercel.app/living
- Discovery API:
  https://rallivio-git-feature-creator-platform-subscription-san-eca6.vercel.app/api/discovery?limit=60
- Vercel project ID: `prj_FKsi7Jy0AtS7GAuAYEk3UbuIJBFU`
- Vercel team ID: `team_CivLA0IfaNod65bkBLLRkBeZ`
- Supabase project: `rallivio`
- Supabase project ID: `dzcnmatbszerparrcgem`
- Supabase region: `ap-south-1`
- Supabase API URL is project-specific; do not expose secrets.
- The root `/` route is served through middleware to `/living`; do not assume `app/page.tsx` controls the root.
- User preference: step-by-step, concrete evidence, no guessing, assistant should continue fixing/deploying until READY or a genuine external blocker.

## 2. Branch safety / immutable checkpoints

Never write to `main`, `staging`, or any checkpoint branch.

Branches currently known:
- archive/checkpoint-living-front-v10-original
- checkpoint/creator-platform-v13
- checkpoint/living-front-v2
- checkpoint/living-front-v3
- checkpoint/living-front-v4
- checkpoint/living-front-v5
- checkpoint/living-front-v6
- checkpoint/living-front-v7
- checkpoint/living-front-v8
- checkpoint/living-front-v9
- checkpoint/living-front-v10
- checkpoint/living-front-v11
- checkpoint/living-front-v12
- feature/creator-platform-subscription
- feature/discover-front-simplification-01
- feature/discover-upper-approved-01
- feature/docs-enforcement
- feature/living-core-platform-routing
- feature/living-ecosystem-v3
- feature/living-position-editor
- feature/phase0-data-foundation
- feature/verify-pipeline
- feature/youtube-qa-bootstrap
- feature/youtube-real-discovery
- feature/youtube-real-discovery-qa
- feature/youtube-real-discovery-qa2
- feature/youtube-real-discovery-qa3
- feature/youtube-real-discovery-qa4
- main
- staging

Protected recovery points:
- checkpoint/living-front-v11 = `e8ca375c631f9a47f3aca1c65c3a52b76f6869d6`
- checkpoint/living-front-v12 = `52ef921d482c40d9dce1e8bb6016cdfd3b227ed2`
- archive/checkpoint-living-front-v10-original = `785b8c305708bf9d495601cf74b81728941c82f5`
- Never move, overwrite, force-update, or reuse these.

Main was accidentally targeted by a GitHub file-write once. It was restored to:
`59b9d8e4211211b4edd3a3a00506a1b3b930959f`
No checkpoint was intentionally changed.

## 3. Current code/deployment state

Latest known feature implementation commit:
- `87ff7b4f7315502311587f047188e27b4931104c`
- Message: `Narrow On the Rise to sustained velocity growth`
- Vercel deployment:
  - ID: `dpl_Cqb8BwJfuBBfwWnmSs5iqH9L5611`
  - SHA: `87ff7b4f7315502311587f047188e27b4931104c`
  - State: READY
  - Alias: the Live Preview URL above
- Latest signal cron on this deployment returned HTTP 200.
- Latest signal batch observed_at: `2026-09-19 17:53:54.305+00`.

Important verification gap:
- CI run `35459031191` succeeded at SHA `7d4d5ab81d77d46078e9c4d8a95a91f941ee446c`.
- Later commits `c7e2b26...` and `87ff7b4...` followed that CI success.
- Therefore the latest SHA `87ff...` has NOT yet been independently verified by a successful `npm run verify` run in CI.
- Before declaring the next implementation complete, obtain verify evidence for the final SHA.
- The workflow was temporarily configured to run on feature branches for verification, then restored to main/staging. Do not leave unnecessary workflow-trigger changes.

## 4. Canonical project-memory rules

Read before implementation:
1. `docs/CANONICAL.md`
2. `docs/RALLIVIO_STATE.md`
3. Current relevant spec/design
4. Last 3 `docs/SESSION_LOG.md` entries
5. `docs/KNOWN_ISSUES.md`
6. Inspect actual branch/code/diff.

After meaningful changes:
- update living state if requirements/architecture/implementation status changed
- append SESSION_LOG
- update KNOWN_ISSUES for bugs/failures and resilience ladder
- run `npm run verify`
- document exact next action and gotchas.

Never modify `docs/DECISIONS.md` or `docs/CANONICAL.md` casually.

## 5. Product / architecture

RALLIVIO is a creator-discovery intelligence platform.
- YouTube is the initial source for discovery, statistics and playback.
- RALLIVIO does not host/fabricate video content.
- Request-time serving must use RALLIVIO's persisted Supabase data.
- Acquisition/refresh/signal computation runs in background workers.
- Derived metrics are RALLIVIO-owned and must be labelled as such.
- Fair discovery is based on relative performance, not simply absolute reach.
- Exact user intent is hard: topic, format and language are not silently changed. Region/signal strength may relax only with visible labeling.
- Current visual Living Field baseline is protected; make isolated changes only.
- Do not add request-time YouTube API calls.

## 6. Current YouTube acquisition architecture

Worker: `lib/server/youtube-discovery.ts`

Acquisition:
- uses `videos?chart=mostPopular`
- expanded regions to about 50:
  IN, US, GB, CA, AU, DE, BR, JP, KR, SG, FR, ES, IT, MX, AR, CO, CL, PE, ZA, NG, KE, EG, AE, SA, TR, NL, SE, NO, DK, FI, PL, PT, ID, MY, TH, PH, VN, NZ, IE, CH, AT, BE, GR, CZ, RO, HU, IL, PK, BD, LK
- categories include:
  1 Film & Animation
  2 Automotive
  10 Music
  15 Pets & Animals
  17 Sports
  19 Travel & Events
  20 Gaming
  22 People & Blogs
  23 Comedy
  24 Entertainment
  25 News & Politics
  26 Howto & Style
  27 Education
  28 AI & Tech
  29 Nonprofits & Activism
- acquisition unique base-row cap = 7,500
- bounded concurrency
- channel statistics are batched
- YouTube usage is tracked in `api_usage`
- no fake data is allowed.

Refresh:
- tiered cohort refresh
- HOT stale after 1 hour
- WARM stale after 6 hours
- COLD stale after 24 hours
- existing per-pass targets were HOT 5,000, WARM 3,340, COLD 4,170
- YouTube `videos:batchGetStats` is used in batches of 50, concurrency 12
- each batch call costs 1 unit in the verified 2026 API design used here
- do not assume the old `refreshed: 2, youtubeCalls: 1` result proves scheduler correctness; re-run and inspect actual HOT selection.

Signal refresh:
- recent snapshot RPC:
  `public.get_recent_video_snapshots(text[])`
- batches IDs in groups of 200 to avoid Supabase REST 1,000-row cap
- publishes signal rows before cleaning old rows
- latest snapshot history is reversed into chronological order before scoring
- multi-label signals are stored in `discovery_signals.signal_labels`
- Live is ONLY true when YouTube `snippet.liveBroadcastContent === 'live'`; never inferred.

## 7. Current signal implementation / Item 1

User's required signal rules:
- Now Moving = top 25% velocity inside (topic x region x format)
- Breaking Out = top 10% acceleration inside that cell
- On the Rise = positive velocity across 3+ consecutive snapshots
- Under Radar = top 10% audience-relative score with shrinkage
- Just Dropped = published within freshness window
- Live = actual YouTube live status only
- multiple labels allowed
- freshness gate suppresses stale labels.

Current implementation uses percentile ranking for movement/breakout/radar and freshness gates:
- movement freshness: 6h
- breakout freshness: 6h
- rise freshness: 12h
- radar freshness: 12h
- dropped freshness: 48h
- live freshness: 1h

IMPORTANT DEVIATION:
- Commit `87ff...` changed On the Rise from “positive views across 3+ consecutive snapshots” to “3+ consecutive velocity increases”. This was done because the literal rule was producing an overly broad result.
- This is not exactly the user's written requirement. If revisiting Item 1, explicitly decide whether to restore the exact requirement instead of silently changing it.
- Percentile implementation assigns 0 to the top-ranked item; therefore `<= .25` is top 25% and `<= .10` is top 10%.
- Singleton cells currently get percentile 0, meaning a one-item cell can qualify for both movement/breakout. This should be reconsidered when implementing the fallback/cell system.

Verified latest signal-label distribution after Item 1:
- Now Moving: 776 (30.02%)
- Just Dropped: 694 (26.85%)
- Breaking Out: 377 (14.58%)
- Under the Radar: 377 (14.58%)
- On the Rise: 361 (13.97%)
- Live: 0
- latest batch size: 1,582 rows
- Now Moving is the largest bucket, so the primary Item 1 objective was achieved.
- Live=0 is acceptable because no currently observed video met the actual live + freshness gate.

## 8. Discovery feed architecture

`app/api/discovery/route.ts`
- bounded `limit` query parameter 20..100; default 60
- optional bounded cursor by `global_rank`
- optional region/topic/signal filters
- reads `feed_rankings`, not the raw 3,000-row signal query
- exact count uses HEAD/range
- returns pool count without the old 1,000-row cap
- cache headers: `public, s-maxage=15, stale-while-revalidate=60`
- `dynamic = force-dynamic`
- signal metadata comes from ranking
- latest feed ranking includes `format` and `signal_labels`.

`app/living/page.tsx`
- fetches `/api/discovery?limit=60`
- uses default cache instead of no-store
- truth-state strings derive from real `api_usage` timing:
  - not started / active / idle
- source activity is not fabricated.

Detail routes implemented:
- `/topic/[slug]`
- `/creator/[handle]`
- `/video/[id]`
- dynamic OG metadata route: `/api/og`
- `app/layout.tsx` has OpenGraph/Twitter metadata using dynamic OG.

Accessibility/icon cleanup implemented:
- search aria labels
- decorative icons aria-hidden
- removed arbitrary category glyphs
- removed decorative heart/circle/external-link characters from pulse metadata.

## 9. Data / migrations already applied

Applied and committed migrations:
- `20260919030000_add_api_usage.sql`
  - `api_usage(service, endpoint, units, metadata, created_at)`
- `20260919043000_add_rallivio_preview_scheduler.sql`
  - Supabase pg_cron/pg_net preview scheduler
  - Vault scheduler token
  - acquisition every 6h, refresh hourly at :15, signals hourly at :30
- `20260919102000_get_recent_video_snapshots.sql`
  - service-role RPC returning latest 5 snapshots per requested video
- `20260919170000_scale_observation_tiers_and_feed_rankings.sql`
  - tier columns/indexes
  - feed_rankings materialized view
  - hourly feed_rankings refresh at :35
- `20260919173000_add_observation_tier_rebalance.sql`
  - creates `rebalance_youtube_observation_tiers()`
  - IMPORTANT: its current SQL is still the OLD absolute-threshold implementation and must be replaced in Item 2.

Later Item 1 migration also added:
- `discovery_signals.signal_labels jsonb not null default '[]'`
- rebuilt `feed_rankings` to carry `signal_labels` and `format`
- unique index by video_id.

## 10. Current data evidence

Latest verified before this handoff:
- `youtube_discovery_pool`: 2,797 rows
- `discovery_signals`: latest batch 1,582 rows
- unique signal videos in latest batch: 1,582
- `feed_rankings`: 2,797 rows at the previously verified point
- earlier tier distribution before Item 2: HOT 1,615, WARM 1,176, COLD 6, ARCHIVE 0
- HOT was ~58%, clearly inverted relative to the intended quota design.
- snapshot table earlier had 40,081 rows and 7,840 distinct video IDs; this includes IDs beyond the current pool and must not be conflated with pool size.
- source (topic x region x format) diagnostic had 295 nonempty cells; 11 with 1 video, 9 with 2–3, 275 with 4+.
- These source diagnostics are NOT the requested final 1,512 UI cell matrix.

## 11. Known issues / resolved incidents

- KI-010: orphaned JSX `/span>` in `app/living/page.tsx`, fixed in commit `8578ca...`.
- KI-011: Vercel build-log connector unavailable.
- KI-012: Vercel Hobby cron validation failure resolved by moving frequent scheduling to Supabase pg_cron.
- KI-013: stale Preview data / no scheduler.
- KI-014: accidental main-branch write; main restored.
- KI-015: YouTube chart 404 / acquisition cell / 502 handling.
- KI-016: Supabase REST 1,000-row cap / refresh / snapshot pagination.
- KI-017: signal worker snapshot pagination suppressed all videos; fixed using RPC + per-video batching + publish-before-cleanup.
- Husky pre-push guard:
  `npm run build || exit 1`
  commit: `34a1a4ac6dfc92148d19561adf53d05ea3dcd9a4`.

## 12. The exact next task requested by owner

The owner supplied a three-part ordered task:
1. Fix signal distribution.
2. Fix tier ratio and verify HOT scheduler.
3. Implement per-cell counts/filter collapse.

Item 1 has been implemented and verified at the live Preview:
- latest labels: 776 / 694 / 377 / 377 / 361 / 0
- Now Moving is largest.
- deployment `dpl_Cqb8...` READY.
- latest signal cron HTTP 200.

DO NOT start Item 2 until Item 1 is verified. It is now verified, so Item 2 is the next active work.

### Item 2 exact requirements
- Replace absolute tier promotion with percentile-based promotion.
- User wording: top ~10% acceleration within each topic becomes HOT candidate, target roughly 5% HOT, 20% WARM, remainder COLD.
- Preserve ARCHIVE only for genuinely stale/no-movement data if needed.
- Current rebalance function is absolute and must be rewritten.
- Re-enable tier rebalance at the end of the signal pass after Item 1 verification.
- Inspect refresh selection query as part of the fix.
- Use actual schema column `stats_refreshed_at`; do not blindly use conceptual `last_refreshed_at`.
- Verify:
  `select tier, count(*), min(stats_refreshed_at), max(stats_refreshed_at) from youtube_discovery_pool group by tier;`
- Then run refresh and inspect actual result/API usage.
- User specifically wants another refresh about an hour later so HOT rows are actually stale and selection can be proven. Do not claim this before evidence.
- Expected current-scale target for 2,797 rows is roughly HOT ~140, WARM ~560, remainder COLD, subject to the percentile design and archive exceptions.

### Item 3 exact requirements (must wait until Item 2 is verified)
- Collapse region UI to:
  1. Worldwide
  2. user's detected region
  3. one country picker
- Do not expose 50 peer regions as simultaneous filter choices.
- Language becomes displayed metadata, not a filter.
- Create cached materialized `cell_counts`.
- Because signals are multi-label, cell_counts must count each label (unnest `signal_labels`) rather than only primary `signal_type`.
- Refresh cell_counts after each signal pass.
- Expose via small cached endpoint, read once per page load.
- Topic pills display counts and zero-count topics are disabled.
- Thin-cell fallback cascade:
  format -> region -> signal tier -> guaranteed pool
- Never silently change topic.
- Label every relaxation.
- Feed cell coverage into future acquisition `pool_health` targeting.
- Item 3 reporting must cover zero / 1-5 / 6-20 / 20+ cells.
- Be careful: a materialized DB view over source regions does not directly equal the 3 UI region modes; design the UI mapping explicitly rather than silently pretending they are the same.

## 13. Reporting required at end of full task

After Items 1, 2, 3 are genuinely implemented and verified, report:
1. Signal distribution across all six labels
2. Tier distribution and HOT percentage
3. Cell coverage: 0, 1–5, 6–20, 20+
4. Current daily `api_usage` total against 10,000 units/day
5. Whether HOT scheduler actually selected stale HOT rows on the later refresh
6. Final deployment SHA + Vercel deployment ID + READY state + live route
7. CI/`npm run verify` result for the final SHA.

Do not claim 1M real signals unless the database contains 1M real signal rows. Current pool is only ~2.8K; scale work is about architecture and acquisition coverage, not fabricated counts.

## 14. Quota / acquisition constraints

- YouTube default quota context used by this project: 10,000 units/day.
- Acquisition is quota constrained.
- Request-time serving must not call YouTube search.
- Avoid fabricating millions of videos/signals.
- `api_usage` must remain the authoritative internal usage log.
- The growth curve needs continuous visibility before scaling acquisition.

## 15. Important historical progression

- Started from static/hard-coded discovery UI.
- Moved to real YouTube vertical slice.
- Added acquisition, snapshots, signals, Supabase serving.
- Added scheduler via Supabase because Vercel Hobby is daily-only for Vercel crons.
- Expanded acquisition from 10 regions to ~50.
- Expanded pool cap from 2,500 to 7,500.
- Fixed snapshot pagination causing signal suppression.
- Added bounded discovery API and feed_rankings materialized view.
- Added tier architecture and batch statistics refresh.
- Added truth-state UI, dynamic OG, detail pages and accessibility cleanup.
- Signal engine was changed from absolute thresholds to cell-relative multi-label percentiles.
- Item 1 is now verified.
- Item 2 is next.
- Item 3 follows only after Item 2 verification.

## 16. Important implementation gotchas

- Do not use `last_refreshed_at`; current pool field is `stats_refreshed_at`.
- Do not assume a successful HTTP 200 cron means data changed; inspect DB timestamps/counts.
- Do not infer Live from recency or velocity.
- Do not use a stale/mixed signal batch when reporting; filter to the latest `observed_at`.
- `discovery_signals.signal_labels` is the source for multi-label signal distribution.
- `feed_rankings` is one row per video; label counts require unnesting labels.
- Current percentile singleton behavior is potentially too permissive.
- Current On the Rise implementation is stricter than the owner's literal wording.
- No package-lock exists; CI must use `npm install`, not `npm ci`.
- CI docs checks require `fetch-depth: 0`.
- Verify workflow trigger was restored after feature verification; do not leave it permanently broad without reason.
- A stable Preview alias is used for scheduler testing.
- Manual scheduler calls were made via Supabase pg_net + Vault token. Never expose the token.

## 17. Current canonical files / docs

Current index includes:
- `docs/CANONICAL.md`
- `docs/AI_START_HERE.md`
- `docs/RALLIVIO_STATE.md`
- `docs/RALLIVIO_MASTER_v2.md`
- `docs/RESILIENCE_SYSTEM.md`
- `docs/KICKOFF_INSTRUCTIONS.md`
- `docs/SESSION_LOG.md`
- `docs/KNOWN_ISSUES.md`
- `docs/RUNBOOK.md`
- `docs/specs/living-discovery-environment-v1.md`

Other historical handoffs/checkpoints exist and should be treated according to CANONICAL/AI_START_HERE rules.

## 18. Start command for the next AI session

Start by reading:
1. this handoff
2. `docs/CANONICAL.md`
3. `docs/RALLIVIO_STATE.md`
4. last 3 `docs/SESSION_LOG.md` entries
5. `docs/KNOWN_ISSUES.md`
6. current `lib/server/youtube-discovery.ts`
7. current tier migrations.

Then verify the active feature SHA and CI status before modifying anything.

First implementation action for the next session:
**Item 2 — replace absolute tier rebalance with percentile-based tier promotion, then verify actual HOT/WARM/COLD distribution and HOT refresh selection. Do not begin Item 3 until that verification is complete.**
