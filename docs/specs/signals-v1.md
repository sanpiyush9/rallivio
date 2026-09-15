# RALLIVIO Signals v1

**Status:** CURRENT for Phase 0
**Source:** RALLIVIO Master v2.0 Part 9 and Kickoff Session 5.

## Observation math

For a video with two snapshots:

`velocity = Δviews / Δtime`

With three snapshots:

`acceleration = change in velocity`

If the required snapshots do not exist, return `null`. Never estimate missing history.

## Phase 0 signal rules

Signals rank within a `(topic × region × format)` cell.

- **Now Moving:** top 25% by current velocity.
- **Breaking Out:** top 15% by acceleration.
- **On the Rise:** positive velocity sustained across at least 3 snapshots.
- **Under the Radar:** strongest audience-relative score among eligible creators.
- **Just Dropped:** publication is inside the configured freshness window.

A signal label is suppressed when its newest supporting snapshot is older than that signal's freshness window.

## Audience-relative score

1. Bucket creators by log-scale subscriber count × category.
2. Compute expected performance as median views-per-video for that bucket.
3. `residual = log(actual_views / expected)`.
4. `shrunk = residual × n / (n + k)` where `n` is recent video count and `k = 5`.
5. Eligibility floors: at least 100 views, at least 3 recent videos, and at least 30 days channel age when channel age is available.

The shrinkage is mandatory so one lucky video from a tiny channel cannot dominate the leaderboard.

## Evidence

Every published signal carries the observations that justified it: snapshot times, view deltas, velocity/acceleration when available, sample count, peer baseline, and freshness. Derived values are labeled **RALLIVIO Momentum Score** or another explicit RALLIVIO metric, never as a YouTube metric.
