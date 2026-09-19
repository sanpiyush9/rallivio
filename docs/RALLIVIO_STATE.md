# RALLIVIO — Living Requirements & Project State

> **Purpose:** This is the living memory of the project. It records what RALLIVIO is required to do, what has changed, what is currently implemented, and what is deliberately not implemented. Future AI sessions must read this file before changing product behavior.
>
> **Rule:** Never rewrite history to make the project look cleaner. Append dated changes. If a requirement changes, record the old requirement, the new requirement, the reason, and the implementation impact.
>
> **Continuity rule:** This repository documentation is the source of truth for project continuity. A new AI session must not reconstruct requirements from chat history or guess from existing code when the documented state is available.

## 1. Current product direction

**Last updated:** 2026-09-16

RALLIVIO is a creator-discovery intelligence platform. YouTube remains the source for video/content playback and source metadata; RALLIVIO adds discovery, normalization, signal calculation, ranking, fair-opportunity logic, and attribution.

RALLIVIO must not host or fabricate video content. YouTube videos should be playable through YouTube embeds or linked back to YouTube. RALLIVIO stores metadata and historical statistics needed for its own derived signals.

RALLIVIO is now also implementing a **Living Discovery Environment**: the real verified discovery state drives a dynamic visual environment. Motion and simulation are presentation mechanisms only and must never fabricate factual platform activity.

## 2. Non-negotiable requirements

1. **Truth first:** Never fabricate creators, videos, metrics, freshness, rankings, or engagement.
2. **YouTube is the source:** Use official YouTube APIs for discovery/statistics and YouTube embeds for playback. Do not scrape YouTube.
3. **Request-time safety:** Request-time serving should read from RALLIVIO's own persisted discovery data rather than spending expensive search quota per visitor.
4. **Historical data matters:** A fair momentum/rising score requires observations over time; one snapshot cannot honestly prove acceleration.
5. **Derived metrics are ours:** Label derived metrics as **RALLIVIO Momentum Score** or another clearly RALLIVIO-owned signal name, never as a YouTube metric.
6. **Fair opportunity:** Ranking must not simply reward the largest subscriber base. Creator size is context; performance relative to a creator's own baseline and comparable peers is important.
7. **No paid ranking:** Future subscriptions/brand relationships must not silently buy ranking position.
8. **Exact intent:** Never fill a requested topic/format/region with unrelated content. If constraints must relax, record and label the relaxation.
9. **Source timestamps:** Distinguish YouTube publication time from RALLIVIO acquisition/observation time.
10. **Embeds are not stored video:** We store IDs/metadata, not the video files themselves.
11. **Living environment truth boundary:** Real data determines factual state. Motion, spatial layout, transitions and visual simulation may communicate that state but must never be presented as real metrics or fabricated activity.
12. **Responsive interaction:** Pointer, touch, click, keyboard focus and navigation may change presentation and discovery focus, but must not break scrolling, accessibility, or factual ranking.

## 3. Phase transition record

### Phase 0 — Original approved scope

- One public weekly emerging-creator leaderboard.
- One niche and one region initially.
- YouTube only.
- Outbound click attribution.
- No login, creator registration, brand marketplace, payments, or additional social platforms.

### 2026-09-15 — Transition toward a real-data vertical slice

**Old implementation:** Static Discover UI with hard-coded creator/video examples.

**New implementation direction:** Replace fake UI values with a thin, truthful YouTube-backed vertical slice. The first slice will prove the core loop before expanding the product surface:

`YouTube source → acquisition → normalized data → RALLIVIO signal/ranking → Discover UI → YouTube playback/outbound attribution`

The broader product vision now explicitly includes Trending content, Rising/Breaking Out/Under the Radar signals, creator subscriptions/following, and fair opportunities. These are product direction, not permission to implement every feature at once.

**Reason:** The user explicitly rejected continuing to polish a static prototype and wants the real data and ranking mechanism to become the product's working foundation.

**Implementation boundary for this step:** YouTube only; start narrow; no scraping; no fabricated fallback data; no full marketplace/auth/subscription system yet.

### 2026-09-16 — Approved transition: Living Discovery Environment

**Old requirement:** RALLIVIO Discover presents real source-backed content through a mostly conventional feed/card interface.

**New requirement:** RALLIVIO Discover/Home becomes a **living simulated discovery ecosystem**. Verified platform data controls the factual state, while dynamic visual presentation communicates movement through spatial nodes, transitions, video/images, responsive interactions and platform-specific environments.

**Why it changed:** The user wants visitors to immediately understand that RALLIVIO represents what is moving across the creator internet, not another static analytics dashboard or video directory. The interface itself should change as verified trends change and should respond to user touch/pointer interaction.

**Impact:** The UI now has a Living Discovery Environment layer. The existing signal/feed/player remains the information and truth layer beneath it. Future platform pages will share normalized intelligence but can use platform-specific visual grammars.

**Truth rule:** “Live” refers to refreshed verified state plus responsive presentation. It does not authorize fake second-by-second metrics, fabricated activity, or simulated engagement claims.

**Implementation status:** **IMPLEMENTING.** V1 is now being built on `feature/youtube-real-discovery`.

**Validation:** First V1 implementation added a signal-driven visual node field around the real selected YouTube content, periodic persisted-pool refresh, pointer/touch-compatible selection, responsive layout, and reduced-motion handling. Automated verification and user field QA are still pending for this V1 change.

**Date:** 2026-09-16

## 4. Requirement transition protocol

RALLIVIO is expected to evolve as real data, UI testing, QA, and business decisions reveal better requirements. Evolution is allowed. **Silent requirement mutation is not.**

Every meaningful requirement transition must be recorded using this exact chain:

`Current requirement → New requirement → Why it changed → Impact → Implementation status → Validation/QA → Date`

A requirement transition includes changes to any of these: product scope, user journey, ranking behavior, data truth rules, architecture, security, integrations, design behavior, monetization rules, or acceptance criteria.

### Transition rules

1. The current canonical document remains authoritative until the transition is explicitly recorded.
2. The old requirement is never erased from history.
3. The new requirement must state whether it is **proposed**, **approved/current**, or **implemented**.
4. If a canonical specification changes, `docs/CANONICAL.md` must be updated in the same change.
5. Implementation must not begin from an unapproved requirement when the change affects product scope, architecture, security, or business rules.
6. After implementation, QA/verification status is recorded before the requirement is considered complete.
7. Deferred work remains visible in this file and in the session log until completed or explicitly superseded.

### Requirement status vocabulary

- **CURRENT** — approved requirement used for implementation.
- **PROPOSED** — suggested change; not yet authorized for implementation when approval is required.
- **IMPLEMENTING** — current requirement is being built.
- **VERIFIED** — implementation has passed the applicable automated/user QA.
- **DEFERRED** — intentionally postponed; reason recorded.
- **SUPERSEDED** — replaced by a later approved requirement; history retained.

## 5. AI operating contract

The AI working on RALLIVIO is responsible for maintaining continuity, not merely writing code.

### Before work

- Read `docs/CANONICAL.md`.
- Read this file.
- Read the latest 3 `docs/SESSION_LOG.md` entries.
- Search `docs/KNOWN_ISSUES.md` before debugging.
- Inspect the branch, current implementation, and relevant diffs.
- Identify the requirement and decision that authorize the intended change.

### During work

- Make the smallest isolated change that satisfies the current requirement.
- Do not silently change unrelated behavior.
- Reuse documented architecture and decisions.
- If a requirement conflict is discovered, stop and reconcile it rather than choosing randomly.
- If a failure matches a known issue, follow its documented recovery path before inventing a new one.

### After work

The AI must synchronize project memory without waiting for the owner to request it:

- Requirement/scope change → update this file's transition/change ledger.
- Code change → update `docs/SESSION_LOG.md`.
- Bug/failure → update `docs/KNOWN_ISSUES.md` and regression coverage where practical.
- Canonical spec/design change → update `docs/CANONICAL.md` in the same change.
- Important architecture/decision change → record the decision and rationale in the project's decision record when available.
- Run verification before proposing a PR.
- Leave an exact next action for the next session.

This means the project should become **more documented as it changes**, rather than depending on the owner to remember what changed.

## 6. Data contract — first real slice

A discovery item should contain, where available:

- YouTube video ID
- creator/channel ID
- title
- description
- published time
- thumbnail URL
- channel title
- channel subscriber count when available
- video view count when available
- like count when available
- comment count when available
- duration/live state when available
- source platform = YouTube
- RALLIVIO acquisition/observation timestamp
- RALLIVIO-derived signal/score

Missing fields remain missing. They are never replaced with invented values.

## 7. First ranking model

The initial RALLIVIO score is intentionally transparent and versioned. It should combine measurable factors such as:

- freshness
- recent view velocity
- acceleration when enough historical observations exist
- engagement relative to views
- performance relative to the creator's own recent baseline
- performance relative to comparable creator size/topic cohorts

Large absolute audience alone must not be enough to dominate an emerging-creator ranking.

If insufficient history exists to calculate acceleration or baseline-relative performance, the UI must say that the signal is limited rather than pretending the metric is precise.

## 8. Playback rule

The RALLIVIO UI may show a real YouTube video using its official embed/player URL. RALLIVIO does not download, proxy, or store the video itself.

The discovery card must preserve the source identity and provide a clear route to YouTube.

## 9. What is implemented right now

- Next.js/TypeScript UI scaffold and QA surface.
- GitHub feature-branch workflow.
- CI verification for typecheck, lint, test, build, canonical checks, and documentation checks.
- Living known-issues register and session log.
- Repository-level Vercel configuration for the Next.js `.next` output.
- **Real-data YouTube discovery vertical slice is running on `feature/youtube-real-discovery` Preview.**
- Temporary Preview-only QA bootstrap successfully acquired 25 real YouTube records for `INDIA:Technology:all`.
- Normal request-time `/api/discovery` serving path successfully returns persisted discovery-pool records after acquisition.
- Supabase-backed discovery pool is populated with real YouTube metadata, snapshots/channel context, and RALLIVIO-derived signal metadata.
- Discover UI has been field-tested with real data and a working YouTube embed/source route.
- Vercel Preview Authentication was disabled for QA so automated route testing can reach the Preview deployment.
- **Living Discovery Environment V1 implementation is now present:** signal-driven visual nodes, real thumbnails, dynamic focus/selection, periodic persisted-pool refresh, responsive layout, and reduced-motion handling.
- Living Discovery Environment V1 specification exists at `docs/specs/living-discovery-environment-v1.md`.
- Living requirements/continuity protocol is registered as canonical in `docs/CANONICAL.md`.

## 10. What is not yet implemented / verified

- Full production discovery-intelligence mechanism across Region × Topic × Format × Signal.
- Robust relevance classification beyond the initial narrow acquisition approach.
- Mature historical baseline/acceleration model with enough repeated observations for production-grade signal claims.
- Complete truthful fallback state machine and multi-path acquisition/replenishment architecture.
- Full production-grade Living Discovery Environment with discovery graph relationships and platform-specific environments.
- Creator OAuth/claim flow.
- User subscriptions/following.
- Brand marketplace/matching.
- Additional social platforms and their platform-specific environments.
- Production ranking history and final production operational controls.
- Full user acceptance of the current Discover experience.
- Signal-filter/card consistency is **not yet verified**; current QA observed a possible **Breaking Out vs Just Dropped** mismatch.
- Temporary `/api/qa/bootstrap` must be removed or replaced with a safer operational mechanism before production promotion.
- V1 living-environment automated verification and Preview field test after the latest UI change are pending.

## 11. Change ledger

### 2026-09-15 — Living documentation introduced
- Established this file as the living product-state record.
- Requirement changes must be recorded rather than inferred from old code.
- Current implementation and deferred work are separated explicitly.

### 2026-09-15 — Real YouTube data becomes the immediate implementation priority
- Static creator/video examples are no longer acceptable as the product's data layer.
- YouTube playback should use the official embed mechanism.
- RALLIVIO's differentiated work is discovery, fair ranking, signal calculation, and historical measurement.

### 2026-09-15 — Requirement continuity protocol strengthened
- `docs/CANONICAL.md` now registers this file as CURRENT.
- Requirement transitions now have an explicit old→new→reason→impact→implementation→QA→date chain.
- AI sessions are required to use repository documentation as project memory instead of reconstructing history from chat or assumptions.
- Meaningful implementation, bug, decision, and deferral changes must update the corresponding project record before the session ends.

### 2026-09-15 — First real-data QA checkpoint completed
- Vercel Preview Authentication was identified as the blocker preventing route-level QA and was disabled for the QA Preview environment.
- The temporary QA bootstrap executed successfully and acquired 25 real YouTube records into the RALLIVIO discovery flow for `INDIA:Technology:all`.
- The normal discovery read path returned persisted records after acquisition.
- The user field-tested the Preview UI and confirmed the real-data/player experience is visible.
- A signal consistency issue was discovered during field testing and is now tracked as KI-004 in `docs/KNOWN_ISSUES.md`.
- This checkpoint is implementation/QA progress, not a claim that the full production discovery engine is complete.

### 2026-09-16 — Living Discovery Environment approved and V1 implemented
- The user explicitly approved the transition from a mostly conventional discovery feed toward a living simulated discovery ecosystem.
- Added the canonical V1 experience specification at `docs/specs/living-discovery-environment-v1.md`.
- Implemented a signal-driven visual discovery field in `app/page.tsx` with real YouTube thumbnails, selected-content focus, signal filtering, periodic read refresh, responsive interaction, and reduced-motion handling.
- Updated styling in `app/globals.css` for the living field, node motion, focus state, orbits and responsive layout.
- The V1 implementation uses real persisted discovery records; visual motion is presentation and is not a claim of real-time platform activity.
- Automated verification and post-deploy field testing remain pending.

## 12. Session handoff rule

At the end of every development session:

1. Update this file when product behavior, scope, architecture, requirement status, or implementation status changes.
2. Append to `docs/SESSION_LOG.md`.
3. Update `docs/KNOWN_ISSUES.md` for bugs/failures according to the resilience ladder.
4. Run `npm run verify` before proposing a PR.
5. State the exact next action/file so the next session resumes without guessing.
6. Do not leave an undocumented requirement transition, decision, failure, gotcha, or deferred task behind.

## 13. Current recovery checkpoint — 2026-09-16

**Branch:** `feature/youtube-real-discovery`

**Latest documented state:** The first real-data vertical slice is working, and Living Discovery Environment V1 has been implemented on top of the verified discovery pool.

**Verified foundation:**

`YouTube API → acquisition route → Supabase persisted pool → /api/discovery read path → Living Discovery Environment → Discover UI → YouTube player/source`

**Observed successful acquisition:** 25 records, cell `INDIA:Technology:all`.

**Current implementation step:** Validate the Living Discovery Environment V1 deployment and interaction behavior, then fix the signal-selection consistency issue without mixing it into unrelated platform work.

**Security/cleanup:** the temporary QA bootstrap token is development-only and considered exposed. It must not be promoted to Production or reused as a production credential. The bootstrap route must be removed or replaced before production.

**Exact next action:** run `npm run verify`, inspect the resulting checks, deploy/confirm Preview, field-test the Living Discovery Environment, then reproduce and fix the **Breaking Out vs Just Dropped** signal mismatch in isolation.


## 14. Continuity snapshot — 2026-09-18

This section is an operational snapshot for future AI sessions. It supplements the historical sections above and must not erase prior history.

### GitHub repository and branch map
- Repository: `sanpiyush9/rallivio`.
- Active implementation branch: `feature/creator-platform-subscription`.
- Protected/base branches: `main`, `staging`. Never develop directly on either.
- Feature branches currently present: `feature/creator-platform-subscription`, `feature/discover-front-simplification-01`, `feature/discover-upper-approved-01`, `feature/docs-enforcement`, `feature/living-core-platform-routing`, `feature/living-ecosystem-v3`, `feature/living-position-editor`, `feature/phase0-data-foundation`, `feature/verify-pipeline`, `feature/youtube-qa-bootstrap`, `feature/youtube-real-discovery`, `feature/youtube-real-discovery-qa`, `feature/youtube-real-discovery-qa2`, `feature/youtube-real-discovery-qa3`, `feature/youtube-real-discovery-qa4`.
- Immutable UI checkpoint branches: `checkpoint/living-front-v2` through `checkpoint/living-front-v10` (9 checkpoints currently).
- Checkpoint immutability rule: an existing checkpoint branch is never moved. A new checkpoint always gets the next unused version.
- Recovery archive created after the 2026-09-18 checkpoint mistake: `archive/checkpoint-living-front-v10-original` points to the original v10 SHA `785b8c305708bf9d495601cf74b81728941c82f5`.
- Original v10 was accidentally moved to `82a1a391b9505da02d62be7e52625f4e2a2a470a`. The original commit remains in Git history and is additionally preserved by the archive branch above. Do not move either branch.

### Current implementation HEAD
- `feature/creator-platform-subscription` HEAD: `82a1a391b9505da02d62be7e52625f4e2a2a470a`.
- Commit: `Make Living Field immersive and Discover data continuously dynamic`.
- Latest verified READY Preview deployment for this SHA: `dpl_73jrohxYojiFhiNvvaDiG9H7Pd3v`, URL `https://rallivio-6v1emmzyc-san-eca6.vercel.app`, feature alias `https://rallivio-git-feature-creator-platform-subscription-san-eca6.vercel.app`.
- The same SHA was also deployed from the checkpoint branch as `dpl_BL7ucCBqd9NoLr9AA74c5UL9MstP`.
- Previous v10 deployment for SHA `785b8c305708bf9d495601cf74b81728941c82f5`: `dpl_Fy9Kv8dhgBPY6Vhs8vHNvoymsSSq`.

### Current UI implementation
- `app/living/page.tsx` is the current Living Field implementation on the active branch.
- The current Living Field keeps the user-approved visual baseline and adds isolated immersive/dynamic behavior: YouTube node repositioning to avoid overlap, an animated Earth-like visual behind the RALLIVIO core, an abstract global activity map with moving roadway/light effects, rotating Discovery Radar categories, rotating Trending Topics, rotating Creator Spotlight, and a continuously cycling RALLIVIO Pulse carousel with left/right controls.
- The Earth is a CSS/visual approximation, not a geographically accurate 3D globe. The global map is an abstract visual map, not a geographic data map.
- Dynamic rotation changes presentation over the current verified pool; it does not by itself constitute new source acquisition or infinite backend pagination.
- Current data fields used by the Living page include real views, likes, comments, engagement, velocity, momentum and live state when supplied by the API.

### Current creator/auth implementation
- Creator/auth work is on `feature/creator-platform-subscription` and includes Supabase browser/server clients, authentication actions, login/signup/recovery UI, email callback, password reset, authenticated header state and protected account page.
- Existing `public.profiles` creation path is reused; duplicate profile creation logic was not added.
- A Next.js 15 prerender issue on `/login` was fixed by placing the `useSearchParams` consumer behind React Suspense; tracked as KI-005.

### Current data architecture and known drift
- Canonical target architecture remains: background YouTube acquisition/refresh → Supabase persisted pool/snapshots → RALLIVIO signal computation → request-time Supabase reads → UI.
- The current feature branch still contains a direct `/api/youtube/trending` request path used by the Living/Discover experience. This is a known architectural gap against the Data Pipeline specification because user requests must not call YouTube. Do not deepen this pattern; future data work should move toward background acquisition and Supabase-only serving.
- YouTube acquisition currently remains the only real connected external discovery source. Cross-platform adapters are not yet connected.
- The requested broad Radar taxonomy is presentation-ready, but truthful cross-category coverage requires the acquisition pool and signal engine to contain verified observations for those cells. Do not fabricate category activity to make every category appear populated.
- True infinite new-video loading is not yet implemented; current behavior cycles through the available verified pool.
- Signal history remains insufficient for some acceleration/baseline claims; signal labels must remain evidence-based.

### Supabase operational identity
- Project: `rallivio`.
- Project ID: `dzcnmatbszerparrcgem`.
- Organization ID: `klqcejvspgguigbtkzzw`.
- Region: `ap-south-1`.
- Status observed: `ACTIVE_HEALTHY`.
- Current database contains the existing product schema including `public.profiles`, community/battle/report/payment/analytics tables and the discovery-intelligence foundation tables introduced through the Phase 0 migrations. Exact schema should always be re-read before DDL changes.
- Migration history includes the discovery pool/topic/intelligence foundation, Phase 0 data foundation and YouTube quota usage/locking migrations, plus the 2026-09-18 `add_delete_current_user_function` migration.

### Vercel operational identity
- Project ID: `prj_FKsi7Jy0AtS7GAuAYEk3UbuIJBFU`.
- Team ID: `team_CivLA0IfaNod65bkBLLRkBeZ`.
- Latest active feature deployment is the READY deployment listed above.
- Deployment verification rule: branch/ref, expected SHA, deployed SHA, Vercel state and deployment ID must agree before declaring a change live.

### Documentation and source hierarchy
- Start with `docs/CANONICAL.md`.
- Then `docs/AI_START_HERE.md` and `docs/RALLIVIO_STATE.md`.
- Then the current spec/design for the requested area, followed by the latest 3 `docs/SESSION_LOG.md` entries and `docs/KNOWN_ISSUES.md`.
- Existing creator and YouTube pipeline specifications supplied by the owner remain source requirements for those areas; when a spec is not registered in CANONICAL, do not silently treat it as canonical. Reconcile/registration is an explicit documentation task.
- Repository files are the durable project memory. Chat memory is supplementary only.

### Exact current next work
1. Preserve the approved visual baseline; do not broadly redesign.
2. Fix the YouTube request-time architecture by implementing/finishing background acquisition, snapshots and Supabase-only serving in accordance with the data pipeline requirements.
3. Validate and correct the signal engine so displayed signals have sufficient historical evidence and selected filters cannot disagree with item metadata.
4. Remove/replace temporary QA bootstrap infrastructure before production.
5. Continue creator platform implementation from the existing auth foundation without disturbing the Living Field baseline.


## 15. Documentation-sync correction — 2026-09-18

The continuity audit itself added five documentation commits after implementation SHA `82a1a391b9505da02d62be7e52625f4e2a2a470a`. Therefore the active feature branch HEAD is now `f4a1f5f2dc8ab5d8d72362458667f4d83c191e03`. The implementation baseline remains `82a1a391...`; the later commits are documentation-only continuity/self-healing updates. The latest READY Vercel deployment remains the implementation SHA `82a1a391...` until a later deployment is intentionally triggered.

Do not confuse documentation HEAD with deployed implementation HEAD.

## 16. Living Field precision pass — 2026-09-18

Current requirement → Living Field lower surfaces must feel continuously active and professionally informative while remaining truth-bound to verified observations.

New implementation → The Living Field now presents a coherent globe behind the RALLIVIO core, source-coverage-aware Global Activity, a horizontally scrolling verified Pulse stream with inline selected playback, centered Radar motion, momentum-driven topic graphs, and a scrollable creator spotlight pool.

Why it changed → Field QA showed the previous Earth treatment was visually obscured/leaf-like, the Pulse interaction was too limited, the Radar sweep was misaligned, and the topic/creator surfaces appeared static.

Impact → app/living/page.tsx changes only. Existing header/hero/ecosystem baseline is preserved. No new source calls were added and no fabricated metrics were introduced.

Implementation status → IMPLEMENTING / awaiting live QA.

Validation/QA → Source/category bindings were reviewed after implementation. GitHub Actions for the latest commit had not yet emitted a run at the time of this update; live deployment still requires SHA/state verification.

Truth boundary → The continuous Pulse stream may repeat the currently verified pool for presentation continuity. It must not be described as newly acquired content unless the background acquisition system supplies new records.

Date: 2026-09-18


## 17. Discover live hero/header + 3D ecosystem pass — 2026-09-19

**Current requirement →** Discover must feel like a live broadcast of the creator economy: the header must be clean, the hero must react to verified movement, the central Earth must visibly rotate with depth, and social nodes must read as dimensional objects.

**New implementation →** The Discover surface now has a refined header, verified-pool-driven hero headline rotation, live source ticker, layered animated Earth/orbit treatment, reflective spherical platform nodes, and an additional orbital path.

**Truth boundary →** Hero copy rotates only through currently ranked verified discovery observations. Visual Earth/orbit motion is presentation only and must not be represented as precise geographic intelligence.

**Implementation status →** **IMPLEMENTING / Vercel deployment pending READY state.**

**Branch safety →** checkpoint/living-front-v11 was created before this pass and has not been modified.

**Date:** 2026-09-19



## 2026-09-19 — New-chat continuity snapshot

### Verified repository state
- Active branch: `feature/creator-platform-subscription`
- Current HEAD: `2a5835b3370b430086a35301141ed66d23a60d5f`
- Current HEAD verification: GitHub Actions `npm run verify` passed.
- Current implementation is still QA/feature work; no production merge.
- The actual root route is middleware-rewritten to `/living`; visual QA must inspect `app/living/page.tsx`.

### Current five-item Discover status
- Header: IMPLEMENTED in `app/living/page.tsx`.
- 3D globe: IMPLEMENTED in `app/living/page.tsx` + `components/DiscoverGlobe.tsx`; live runtime verification remains pending. Local texture copies remain unimplemented because binary GitHub file writes are not available through the current connector.
- LIVING FIELD pill: IMPLEMENTED as markup removal in `app/living/page.tsx`.
- Platform badges: IMPLEMENTED in `app/living/page.tsx` CSS/interaction.
- Dynamic headline: IMPLEMENTED from the persisted `/api/discovery` response; current DB freshness means it honestly displays `Listening for signals…` until fresh signal observations arrive.

### Current database truth
Supabase `public.youtube_discovery_pool` currently has 25 rows, 25 stored signal rows, zero signal rows fresh within two hours, and latest `stats_refreshed_at` of 2026-09-15 18:37:10.647+00. No ROSÉ, Sur Music or Triple M Movies named seed matches were found. Therefore any UI claim of 50 fresh verified signals would currently be false.

### Current Vercel truth
Latest observed Vercel deployments for this branch are queued on earlier commits; the exact current HEAD `2a5835b...` has not yet been verified as a READY deployment. Do not provide a live URL as proof for the current work.

### Checkpoint safety
- v11 exists and is immutable.
- v10 and its original archive are immutable.
- Next checkpoint is v12, after enumerating existing checkpoint refs.


## 2026-09-19 — Checkpoint record correction
Branch: feature/creator-platform-subscription
Status: Documentation correction

The previous living-state record stated that v10 was the latest checkpoint. That is stale. `checkpoint/living-front-v11` now exists and is the latest protected checkpoint. v11 is immutable and must never be overwritten, moved, or reused. Future checkpoint creation must enumerate existing checkpoint branches and use the next unused version.

This is recorded as a state change rather than silently rewriting the historical checkpoint note.


## 2026-09-19 — Scale-work live-state reconciliation
- **Current implementation status:** Item 1 signal distribution remains verified; Item 2 percentile tier logic is now reconciled into repository migration history and wired to run after each successful signal pass.
- **Live pool size:** 7,840 rows at the latest audit.
- **Live tier target:** HOT 392 (5%), WARM 1,568 (20%), COLD 5,880 (75%), ARCHIVE 0.
- **Tier rule:** top 10% acceleration within topic, globally capped at 5% HOT; WARM is allocated through the 25% cumulative activity band; archive requires 30 days without movement.
- **Refresh rule:** stale selection uses `stats_refreshed_at`, with HOT 1h, WARM 6h, COLD 24h thresholds.
- **Repository reconciliation:** `supabase/migrations/20260919200000_reconcile_percentile_observation_tiers.sql`.
- **Worker change:** `lib/server/youtube-discovery.ts` now calls `rebalance_youtube_observation_tiers` after successful signal publication.
- **Pending proof:** a later stale-HOT refresh must be observed selecting HOT rows and advancing their `stats_refreshed_at`. Item 3 remains blocked until this verification.


## 2026-09-19 — Discovery truth/data normalization
- Signal output is now observation-gated; single-observation videos cannot surface signal or momentum metadata.
- Signal history scoring uses chronological snapshots.
- RALLIVIO topic taxonomy is normalized and backfilled; all 21 UI topics currently have non-zero live coverage.
- Format is normalized to `short` (<60s), `live` (actual live broadcast), or `video`.
- Current live pool has 0 actual live-broadcast rows, so Live signal coverage is not claimed until source data exists.
- Current API sample: 60 verified items; no null-refresh signal violations; multi-label arrays populated; no `format=all`.

## Discovery scale state — 2026-09-20

- Live discovery pool: 7,840 videos.
- Live observation truth: 7,840/7,840 rows have repeated snapshots and a non-null `stats_refreshed_at` derived from the latest repeated snapshot.
- Live signal feed: 4,682 current rows after the truth-gated feed refresh.
- Multi-label counts: Now Moving 2,266; Breaking Out 1,191; On the Rise 385; Under the Radar 1,191; Just Dropped 1,850; Live 0 (no active live-source rows in the current pool).
- Source architecture now combines most-popular regional/category acquisition with a daily 100-cell newest-upload/live search sweep. YouTube's default `search.list` allocation is 100 calls/day, so million-scale coverage requires sustained accumulation and/or an approved quota extension; quota sharding is not an acceptable workaround.
- API/UI source changes for multi-label signal filtering and tab-specific loading are committed on `feature/creator-platform-subscription`; Vercel is currently build-rate-limited, so those source changes await the next successful deployment.


## 18. Neural Grid foundation — 2026-09-20

Current requirement → evolve the discovery backend into an adaptive observation and intelligence engine while keeping the existing RALLIVIO UI/data contract.

Implementation → added explicit UNKNOWN observation state, adaptive 15-minute sampling for unknown candidates, durable entity-aware intelligence events, creator intelligence, topic × region × format intelligence, regional intelligence, deterministic anomaly/percentile state, and `/api/intelligence` read endpoints.

Database → migration 20260920250000_rallivio_neural_grid_foundation is applied to Supabase. Migration 20260920251000_preserve_unknown_observation_tier is applied and the tier rebalance RPC now preserves UNKNOWN until a second observation exists.

Verified database cycle → the cycle successfully recomputed 4,529 signals, 6,864 creator intelligence rows, 714 topic/region/format intelligence rows and 25 regional intelligence rows at 2026-09-19T19:48:07Z. The current pool remains 7,840 rows and the tier distribution remained 389 HOT, 1,672 WARM, 5,779 COLD, 0 UNKNOWN, 0 ARCHIVE because the existing seed population already has repeated observations.

Build gate → .husky/pre-push now runs npm run verify; GitHub verification exposes typecheck, lint, tests, build, canonical and documentation checks as separate workflow steps. No new Vercel deployment is claimed because the team build-rate limit remains active.

Phase boundary → the analytical-storage abstraction is intentionally not represented as a deployed ClickHouse cluster. Supabase/Postgres remains the current application/first analytical node. Additional acquisition sources and trained ML/LLM providers are not claimed as connected.

Date: 2026-09-20


## 2026-09-20 — 100K discovery scale phase started

- **Target:** grow the real discovery pool from the current 7,840 videos toward **100,000+ observed videos** without fabricating observations or signals.
- **Acquisition change:** the rotating YouTube long-tail search sweep is now budgeted by `YOUTUBE_SEARCH_SWEEP_CALLS`, defaulting to 80 search calls/day. With YouTube's standard 100-unit `search.list` cost, this keeps the search portion at about 8,000 quota units/day before other API calls; the budget remains configurable only when an approved quota allocation supports it.
- **Rotation:** recent-upload cells receive 80% of the search budget and live cells 20%, rotating through the global region/category matrix rather than repeatedly querying one fixed subset.
- **Quota telemetry:** `api_usage.units` now records the real 100-unit cost for `search.list` calls instead of treating every endpoint as one unit.
- **Scale observability:** `public.get_discovery_scale_status(100000)` and `/api/discovery/scale` expose actual pool, observed-video, snapshot, signal, event, creator, topic-state and region-state counts plus target progress.
- **Truth boundary:** acquisition creates a persisted initial stats snapshot; signal publication remains observation-gated and cannot use a signal merely because a video was acquired.
- **Current limitation:** reaching 100K is an accumulation process constrained by official source quotas and the number of unique videos discovered. No synthetic backfill, quota sharding, scraping, or invented signal rows are permitted.
- **Next execution step:** run the scaled acquisition on the next successful deployment/scheduled acquisition window, then measure unique pool growth and repeated-observation coverage before increasing the search budget.


## 2026-09-20 — Scale scheduler activated

- The real-data 100K scale phase is now wired for continuous background execution on the existing Supabase scheduler.
- Acquisition runs once daily at 02:00 UTC with the quota-aware 80-call long-tail search budget; the previous 6-hour acquisition cadence was reduced because repeating an 80-call search sweep four times/day would exceed the standard YouTube quota.
- Observation refresh runs every 30 minutes with a 500-video claim batch, prioritizing HOT/WARM and oldest due observations. This keeps repeated snapshots flowing without consuming the entire daily YouTube quota.
- Database signal/intelligence cycle remains every 10 minutes and consumes persisted observations rather than calling YouTube.
- The scale path therefore has a bounded daily source budget and an independent observation cadence; it can accumulate real unique videos over time without fabricating signal data.
