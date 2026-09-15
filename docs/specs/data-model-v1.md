# RALLIVIO Data Model v1

**Status:** CURRENT for Phase 0 data foundation
**Source:** RALLIVIO Master v2.0 Part 5, Part 6, Part 9 and Kickoff Session 3.

## Purpose

Persist only the metadata and time-series observations required to compute the Phase 0 weekly emerging-creator leaderboard. Request-time serving reads only from RALLIVIO's own database; YouTube acquisition runs in scheduled jobs.

## Core tables

### `youtube_discovery_pool`

One row per discovered YouTube video. Required serving dimensions are indexed columns rather than hidden JSON fields.

- `id`: YouTube video ID
- `channel_id`: YouTube channel ID
- `channel_title`, `title`, `description`, `thumbnail`, `url`
- `published_at`: source publication time; used for freshness
- `duration`, `category_id`, `format`, `language`, `language_confidence`
- `region`, `topic`, `topic_tags`
- `embeddable`, `live_broadcast_content`
- `views`, `likes`, `comments`: latest source values only; source metrics remain source metrics
- `acquired_at`: when RALLIVIO acquired the row; never used as content freshness
- `stats_refreshed_at`, `verified_at`, `last_seen_at`, `expires_at`
- `source`, `metadata`

### `video_stats_snapshots`

Time-series source statistics. `captured_at` is the observation time. Velocity and acceleration are computed only when sufficient snapshots exist; values are never estimated.

- `video_id`
- `captured_at`
- `views`, `likes`, `comments`

### `channel_stats`

Channel-level observations used for audience-relative comparison.

- `channel_id`
- `captured_at`
- `subscriber_count`
- `video_count`
- `category_bucket`

### `discovery_pool_health`

One row per served discovery cell: topic × region × format × language. Tracks whether acquisition has enough candidates and when the last collection/refresh occurred.

### `discovery_signals`

Materialized signal observations for the serving layer. Each row carries its evidence and freshness timestamp. RALLIVIO-derived metrics are explicitly named as RALLIVIO metrics.

### `click_attribution`

Records outbound YouTube clicks from RALLIVIO. This proves traffic is sent to the platform and supports future creator acquisition.

## Data rules

1. `published_at` and `acquired_at` are different fields and must never be confused.
2. Request-time code never calls YouTube.
3. Source metrics such as YouTube likes/views are stored as source values; RALLIVIO scores are separate derived values.
4. No video content is stored.
5. Public serving exposes only verified, active, non-expired records.
6. Creator/channel discovery must follow the approved YouTube acquisition policy; no scraping.
