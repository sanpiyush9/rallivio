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
- Living requirements/continuity protocol is registered as canonical in `docs/CANONICAL.md`.

## 10. What is not yet implemented / verified

- Full production discovery-intelligence mechanism across Region × Topic × Format × Signal.
- Robust relevance classification beyond the initial narrow acquisition approach.
- Mature historical baseline/acceleration model with enough repeated observations for production-grade signal claims.
- Complete truthful fallback state machine and multi-path acquisition/replenishment architecture.
- Creator OAuth/claim flow.
- User subscriptions/following.
- Brand marketplace/matching.
- Additional social platforms.
- Production ranking history and final production operational controls.
- Full user acceptance of the current Discover experience.
- Signal-filter/card consistency is **not yet verified**; current QA observed a possible **Breaking Out vs Just Dropped** mismatch.
- Temporary `/api/qa/bootstrap` must be removed or replaced with a safer operational mechanism before production promotion.

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

### 2026-09-16 — PROPOSED: Living simulated discovery ecosystem
- **Current requirement:** RALLIVIO should primarily behave as a signal-first discovery page with real YouTube-backed content and a conventional navigation/feed presentation.
- **New proposed requirement:** Evolve RALLIVIO into a **living simulated discovery ecosystem**: a dynamic visual environment where verified real-world platform signals drive what is shown, while motion, transitions, ambient visualization, responsive cards, video, imagery, and interaction make the ecosystem feel continuously alive.
- **Why it changed:** The user wants visitors to immediately understand that RALLIVIO is not a static dashboard or video directory. The experience should communicate movement, trend changes, discovery chains, creator emergence, and cross-platform activity through the interface itself.
- **Impact:** Home/Discover becomes an adaptive experience rather than a fixed screen. Each platform (YouTube first; later Instagram, X, TikTok, etc.) gets a platform-specific environment whose visual language and content composition adapt to current verified signals. Video, thumbnails/images, motion graphics, signal particles/lines, trend transitions, and responsive interaction become presentation layers over the real discovery intelligence.
- **Truth boundary:** The ecosystem may **simulate the feeling of a live environment**, but it must never simulate fake metrics or pretend fabricated activity is real. Real data determines the factual state; animation and spatial presentation communicate that state. If a value is simulated for presentation, it must not be presented as a real platform metric.
- **Interaction model proposed:** The page should respond to pointer/touch movement, selection, scrolling, signal changes, card focus, and navigation. Interaction should influence presentation (for example, cards/visual layers can subtly react to pointer proximity or touch, selected creators can become a discovery focus, and related signals can animate into view) without interfering with normal scrolling or accessibility.
- **Real-time interpretation:** “Live” means **continuously refreshed and visually responsive**, not necessarily second-by-second source API truth. Source acquisition remains quota-aware and scheduled/persisted; the UI can update from the verified discovery pool as new observations arrive.
- **Core ecosystem loop:** `Verified signals → dynamic visual state → user interaction → deeper discovery → creator/content context → related opportunities → refreshed signals`.
- **Status:** **PROPOSED — not yet approved for implementation.** Do not rewrite the current UI into this architecture until the user explicitly approves the direction and the design/interaction specification is locked.

## 12. Session handoff rule

At the end of every development session:

1. Update this file when product behavior, scope, architecture, requirement status, or implementation status changes.
2. Append to `docs/SESSION_LOG.md`.
3. Update `docs/KNOWN_ISSUES.md` for bugs/failures according to the resilience ladder.
4. Run `npm run verify` before proposing a PR.
5. State the exact next action/file so the next session resumes without guessing.
6. Do not leave an undocumented requirement transition, decision, failure, gotcha, or deferred task behind.

## 13. Current recovery checkpoint — 2026-09-15

**Branch:** `feature/youtube-real-discovery`

**Latest documented state:** The first real-data vertical slice has successfully crossed the acquisition boundary and has been field-tested in the Preview UI.

**Verified flow:**

`YouTube API → acquisition route → Supabase persisted pool → /api/discovery read path → Discover UI → YouTube player/source`

**Observed successful acquisition:** 25 records, cell `INDIA:Technology:all`.

**Current blocker for the next implementation step:** signal selection/display consistency. The user observed the Breaking Out view while the displayed item metadata indicated Just Dropped. Root cause is not yet confirmed.

**Security/cleanup:** the temporary QA bootstrap token is development-only and considered exposed. It must not be promoted to Production or reused as a production credential. The bootstrap route must be removed or replaced before production.

**Exact next action:** inspect `app/page.tsx` and `app/api/discovery/route.ts`, reproduce the selected-signal/item-signal mismatch, fix only that isolated issue, run `npm run verify`, deploy Preview, and field-test again.
