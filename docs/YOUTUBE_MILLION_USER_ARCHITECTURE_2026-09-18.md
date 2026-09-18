# RALLIVIO YouTube Million-User Architecture — 2026-09-18

## Goal

Make Creator → YouTube capable of serving a very large audience without putting a YouTube Data API request on the user request path.

The target is **effectively unlimited user playback and high-scale discovery**, not an attempt to remove or bypass YouTube's API, quota, storage, copyright, or player restrictions.

## Production shape

```
YouTube APIs
   │
   │ controlled ingestion / refresh
   ▼
RALLIVIO acquisition workers
   │
   ▼
Supabase YouTube discovery pool
   │
   ├── freshness / expiry
   ├── deduplication by video ID
   ├── region / topic / format cells
   └── bounded metadata retention
   │
   ▼
RALLIVIO Catalog API
   │
   ├── query/filter/pagination
   ├── Vercel distributed cache
   └── no YouTube API call
   │
   ▼
Creator → YouTube
   │
   └── YouTube IFrame Player
```

## Million-user rule

A normal viewer request must never call `search.list`, `videos.list`, or `channels.list`.

User traffic is:

```
viewer → Vercel cache → Catalog API → Supabase
```

Only acquisition traffic talks to YouTube:

```
scheduled worker → YouTube API → Supabase
```

Playback is handled by YouTube's embedded player and is not proxied through RALLIVIO.

## Quota strategy

1. Prefer `videos.list` candidate pools where appropriate.
2. Batch video IDs and channel IDs.
3. Reserve `search.list` for high-value acquisition/search gaps rather than per-user search.
4. Track quota usage and acquisition health.
5. Expand the approved quota only through YouTube's audit/quota-extension process when real traffic requires it.
6. Never create duplicate API projects/keys to evade quota.

## Data compliance boundary

The catalog is a **refreshable discovery cache**, not a permanent mirror of YouTube.

For non-authorized YouTube API data, refresh or delete stored data within the applicable 30-day window and keep it reasonably consistent with YouTube.

Do not store or proxy YouTube audiovisual content.

Long-term statistical history and derived RALLIVIO metrics require the applicable YouTube permissions/audit path. Until that permission exists, do not treat public YouTube API statistics as a basis for permanent custom scoring.

RALLIVIO-native signals (for example, clicks or saves that happen inside RALLIVIO) must be clearly labeled as RALLIVIO data and kept distinct from YouTube API data.

## Search scale

The Catalog API supports:

- text search
- region
- topic
- format
- signal
- pagination
- CDN/data-cache reuse

The same query can therefore be served repeatedly without another YouTube API call.

The API response uses:

```
Cache-Control: public, s-maxage=30, stale-while-revalidate=300
```

This is intentional: high-frequency identical searches are absorbed by Vercel's distributed cache instead of repeatedly reaching the database.

## No fake "unlimited"

RALLIVIO can provide:

- millions of users
- very large playback volume
- very large search volume
- continuously refreshed discovery inventory

It cannot honestly promise that RALLIVIO has an unrestricted copy of every YouTube video or unrestricted access to every YouTube API search result.

The catalog expands through controlled acquisition and approved quota, while playback can scale independently through YouTube's player.

## Next scale stages

### Stage 1 — implemented

- RALLIVIO catalog read path
- no YouTube API call on catalog reads
- cache headers
- pagination
- filters
- Creator remains the user-facing YouTube experience

### Stage 2

- replace hard-coded acquisition cell with a bounded acquisition queue
- prioritize cells by demand and freshness
- add quota accounting per API method
- add stale-record cleanup

### Stage 3

- regional/topic acquisition fan-out
- worker concurrency controls
- retry/backoff
- dead-letter acquisition records
- freshness SLOs

### Stage 4

- YouTube quota audit/extension application
- approved analytics/derived-metric use case
- long-term statistical snapshots only where explicitly permitted

### Stage 5

- multi-region database/read replicas if traffic requires them
- dedicated search infrastructure when PostgreSQL indexes cease to meet latency/throughput targets
- independent RALLIVIO-native recommendation graph

## Legal/product guardrails

- YouTube remains the playback host.
- Never download or re-host YouTube audiovisual content.
- Keep YouTube attribution/player behavior intact.
- Do not scrape YouTube pages as a quota workaround.
- Do not use third-party "unlimited YouTube API" services whose operation depends on scraping or policy circumvention.
- Keep YouTube API data and RALLIVIO-native data visibly distinguishable.
- Maintain the YouTube Terms and privacy disclosures required for an API client.
