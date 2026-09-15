# RALLIVIO — Living Requirements & Project State

> **Purpose:** This is the living memory of the project. It records what RALLIVIO is required to do, what has changed, what is currently implemented, and what is deliberately not implemented. Future AI sessions must read this file before changing product behavior.
>
> **Rule:** Never rewrite history to make the project look cleaner. Append dated changes. If a requirement changes, record the old requirement, the new requirement, the reason, and the implementation impact.

## 1. Current product direction

**Last updated:** 2026-09-15

RALLIVIO is a creator-discovery intelligence platform. YouTube remains the source for video/content playback and source metadata; RALLIVIO adds discovery, normalization, signal calculation, ranking, fair-opportunity logic, and attribution.

RALLIVIO must not host or fabricate video content. YouTube videos should be playable through YouTube embeds or linked back to YouTube. RALLIVIO stores metadata and historical statistics needed for its own derived signals.

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

## 4. Data contract — first real slice

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

## 5. First ranking model

The initial RALLIVIO score is intentionally transparent and versioned. It should combine measurable factors such as:

- freshness
- recent view velocity
- acceleration when enough historical observations exist
- engagement relative to views
- performance relative to the creator's own recent baseline
- performance relative to comparable creator size/topic cohorts

Large absolute audience alone must not be enough to dominate an emerging-creator ranking.

If insufficient history exists to calculate acceleration or baseline-relative performance, the UI must say that the signal is limited rather than pretending the metric is precise.

## 6. Playback rule

The RALLIVIO UI may show a real YouTube video using its official embed/player URL. RALLIVIO does not download, proxy, or store the video itself.

The discovery card must preserve the source identity and provide a clear route to YouTube.

## 7. What is implemented right now

- Next.js/TypeScript UI scaffold and QA surface.
- GitHub feature-branch workflow.
- CI verification for typecheck, lint, test, build, canonical checks, and documentation checks.
- Living known-issues register and session log.
- Repository-level Vercel configuration for the Next.js `.next` output.
- **Real-data YouTube discovery slice: implementation in progress on `feature/youtube-real-discovery`.**

## 8. What is not yet implemented

- YouTube API credential/configuration in the deployment environment.
- Scheduled acquisition worker and quota-aware search strategy.
- Persistent discovery/time-series schema in Supabase.
- Production ranking history.
- Creator OAuth/claim flow.
- User subscriptions/following.
- Brand marketplace/matching.
- Additional social platforms.

## 9. Change ledger

### 2026-09-15 — Living documentation introduced
- Established this file as the living product-state record.
- Requirement changes must be recorded rather than inferred from old code.
- Current implementation and deferred work are separated explicitly.

### 2026-09-15 — Real YouTube data becomes the immediate implementation priority
- Static creator/video examples are no longer acceptable as the product's data layer.
- YouTube playback should use the official embed mechanism.
- RALLIVIO's differentiated work is discovery, fair ranking, signal calculation, and historical measurement.

## 10. Session handoff rule

At the end of every development session:

1. Update this file when product behavior, scope, architecture, or implementation status changes.
2. Append to `docs/SESSION_LOG.md`.
3. Update `docs/KNOWN_ISSUES.md` for bugs/failures according to the resilience ladder.
4. Run `npm run verify` before proposing a PR.
5. State the exact next action/file so the next session resumes without guessing.
