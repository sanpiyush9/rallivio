# RALLIVIO Phase 0 Leaderboard v1

**Status:** CURRENT for Phase 0
**Source:** RALLIVIO Master v2.0 Part 6 and Part 10; Kickoff Session 6.

## Public scope

One public page: **The 20 fastest-rising tech creators in India this week**.

- One niche: Technology.
- One region: India.
- Weekly computation, Monday 00:00 IST, with previous weeks archived.
- Each creator links to the actual YouTube channel.
- Each entry includes the audience-relative score, evidence, and most recent notable video.
- Every outbound YouTube link is attributed.
- No login, filters, marketplace, or creator registration in Phase 0.

## Ranking

Rank by the audience-relative score defined in `docs/specs/signals-v1.md`. A creator must satisfy the signal engine's evidence floors. If fewer than 20 creators qualify, display only those that qualify and say so honestly. Never pad the list with invented or insufficiently evidenced entries.

## Claims

Only Tier 1 claims are permitted on the public page. Source facts are displayed as source facts. Derived values are explicitly labeled as RALLIVIO-derived metrics. No guaranteed growth, prediction, or "go viral" claim is allowed.

## Freshness

The serving layer must display the age of the underlying observations. Stale signals are suppressed rather than presented as current.
