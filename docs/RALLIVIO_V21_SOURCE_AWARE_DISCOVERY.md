# RALLIVIO V21 — Source-Aware Discovery

## Checkpoint

- Branch: `feature/rallivio-v21-source-aware-discovery`
- Base: V20 commit `3aa5114bbba65f5ceb8c0f1e8d4f4aeda9e10688`
- V21 commit: `0927b6cae394216fc407e5b06e40cdb923d97094`
- Goal: make the discovery contract source-aware without pretending that non-YouTube ingestion already exists.

## What changed

The `/api/discovery` response now carries a normalized source contract:

- `source_family`
- `source_type`
- `format`
- `sourceFamilies`
- optional `source` query filter

The current YouTube records remain `source_family: YouTube`. Future adapters can populate the same contract for Instagram, X, news, blogs, Reddit, stock/market feeds, public posts, and other legitimate public sources without forcing the Discover UI to become source-specific.

## Source types

The API currently normalizes the source type to one of:

- `video`
- `short-video`
- `live`
- `article`
- `post`

This is a normalization layer, not a claim that those sources are already connected.

## Product direction

RALLIVIO should evolve from a YouTube discovery page into a source-agnostic world intelligence surface:

`External signals → source adapters → normalized observations → event/grouping engine → trend intelligence → Discover → Creator / Brands & Opportunities / campaigns`

Each source adapter should write observations into a common contract containing at minimum:

- canonical source URL
- source family
- source type
- publisher/creator identity
- published time
- observed time
- region/language when available
- topic/entity references
- engagement/change measurements
- evidence used for the trend decision

The event layer must remain independent of the source. One real-world event may therefore contain a YouTube video, Instagram reel, X post, news article, blog, or other public source when evidence supports that they refer to the same emerging topic.

## V21 verification requirement

Do not label RALLIVIO as worldwide multi-source until actual adapters are connected and producing observations. The current production truth remains YouTube-only.

Next implementation phase: introduce the first non-YouTube adapter behind the normalized observation contract, then validate cross-source event grouping with real observations before changing the public marketing claims.
