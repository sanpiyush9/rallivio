# RALLIVIO Neural Grid

## Purpose

RALLIVIO is evolving from a periodic YouTube discovery website into an adaptive content-intelligence engine. The website remains the presentation layer; discovery, observation, feature computation and state transitions happen in the background.

The architecture follows the project requirement that source facts are persisted before request-time serving, and that derived signals are based on observed history rather than a single popularity snapshot.

## Implemented foundation

### Discovery

- YouTube remains an official API source.
- Acquisition combines most-popular regional/category cells with a bounded daily newest-upload/live sweep.
- Source identity is retained.
- Request-time discovery reads persisted RALLIVIO state.

### Adaptive observation

The pool now supports:

- `unknown` — insufficient history; waiting for a second observation.
- `hot` — high information value / acceleration.
- `warm` — elevated activity.
- `cold` — normal observation cadence.
- `archive` — stale/no movement.

Unknown candidates are sampled every 15 minutes by the worker. Fast growth can promote an item to a two-minute observation interval; hot, warm and cold cadences remain adaptive.

The database uses lease-based claims with `FOR UPDATE SKIP LOCKED`, so multiple workers can safely share the queue.

### Deterministic signal engine

The current signal engine computes:

- velocity
- acceleration
- engagement
- efficiency
- audience-relative context
- momentum
- percentiles
- signal state
- signal labels

Signal history is retained in `video_stats_snapshots`. A signal requiring movement is not produced from a single observation.

### Event bus

`discovery_signal_events` is the durable event stream for state transitions.

It now supports:

- video signal changes
- creator rising/breakout states
- entity type/id
- signal labels
- evidence
- observed time

This is intentionally database-backed in the current Supabase deployment. It is an event-bus contract, not a claim that a distributed Kafka-style broker is already deployed.

### Creator/topic/region intelligence

The current database cycle materializes:

- creator intelligence
- topic × region × format intelligence
- regional intelligence

Each surface exposes deterministic activity, acceleration, anomaly/percentile context and a state (`stable`, `rising`, `breakout`).

The read API is:

- `/api/intelligence?kind=creator`
- `/api/intelligence?kind=topic`
- `/api/intelligence?kind=region`

## Scale boundary

The current Supabase/Postgres implementation is the application and first analytical node. It is deliberately structured so raw observation storage can later move to an analytical store such as ClickHouse without changing the RALLIVIO UI contract.

The migration boundary is:

source ingestion → raw observations → analytical feature engine → current intelligence state → RALLIVIO API → UI

Do not introduce a second database until workload measurements justify it. The architecture should not pretend that the current 7,840-row seed is already a billion-row deployment.

## ML and AI boundary

AI is not used for every signal.

The deterministic layer remains responsible for measurable facts:

- velocity
- acceleration
- change
- percentile
- freshness
- anomaly score
- confidence

A future ML layer can learn expected activity, creator baselines, seasonality and change points.

A future LLM layer can explain already-computed evidence:

- why a cluster changed
- what changed
- what evidence supports a breakout
- concise trend summaries

An LLM must not invent the underlying metric.

## Acquisition constraints

RALLIVIO must remain within the official source's quota and policy boundaries. Quota sharding, scraping, or artificial multi-project duplication is not an architecture.

Scale is achieved through:

1. efficient candidate discovery;
2. adaptive observation;
3. approved quota expansion;
4. creator-authorized data where permitted;
5. appropriately licensed/approved additional sources;
6. efficient analytical storage and computation.

## Current phase state — 2026-09-20

- Phase 1 global persisted metrics: implemented.
- Phase 2 adaptive observation with explicit UNKNOWN state: implemented.
- Phase 3 analytical-storage migration boundary: architecture-ready; current production node remains Supabase/Postgres.
- Phase 4 durable signal event bus: implemented in Postgres.
- Phase 5 creator/topic/region intelligence: implemented.
- Phase 6 multi-source acquisition framework: source identity and acquisition boundary exist; additional external sources are not connected yet.
- Phase 7 deterministic anomaly/change-point foundation: implemented through percentile/activity/anomaly state; trained ML models are not yet claimed.
- Phase 8 AI explanation contract: architecture defined; no external LLM provider is called by the signal engine.

## Verification rule

A phase is not called live merely because its source code exists. For deployment claims, the active feature branch SHA must match the deployed Vercel SHA and the deployment must be READY. For database phases, the Supabase migration must be applied and the relevant RPC/table state must be queryable.

The current Vercel deployment remains blocked by the team's build-rate limit; this does not invalidate the database work, but it means the latest API/UI source cannot yet be called live.
