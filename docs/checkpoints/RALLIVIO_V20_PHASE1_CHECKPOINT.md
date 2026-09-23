# RALLIVIO V20 — Phase 1 Checkpoint

Date: 2026-09-23
Branch: `feature/rallivio-v20-living-ecosystem`

## Status

**Phase 1 — Living Discover foundation: IMPLEMENTED + BUILD/ROUTE TESTED**

## Completed

- Created isolated V20 development branch from the V19 baseline.
- Added the V20 Discover experience without replacing the existing V18/V19 production/recovery versions.
- Added event-first discovery presentation rather than treating every source item as an isolated feed.
- Added 15m / 1h / 1d / 1w / 1m timeframe controls.
- Wired the UI to the existing real `/api/discovery` endpoint.
- Added World Pulse presentation.
- Added Trend Replay presentation.
- Added event grouping and event detail view.
- Added organic vs RALLIVIO campaign distinction.
- Added RALLIVIO Lens entry point.
- Added honest empty-state behavior.
- Added timeframe-integrity warning so identical result counts are not presented as proof of distinct historical datasets.
- Kept the existing V18/V19 work isolated and recoverable.

## Verification

- V20 page deployment/route was reachable successfully.
- The V20 discovery UI was checked against the live preview.
- The real discovery API was also tested.

## Known integration blocker

The live `/api/discovery` request currently returns HTTP 503 with `CONFIGURATION_REQUIRED` because the deployed environment is missing the required Supabase server configuration. This is an environment/integration issue, not a V20 UI build failure.

Therefore this checkpoint does **not** claim that live discovery data is fully operational yet.

## Next Phase

### Phase 2 — Real Intelligence Data Integrity

1. Restore/verify Vercel Supabase server environment configuration.
2. Re-test `/api/discovery` with real production data.
3. Verify 15m / 1h / 1d / 1w / 1m are genuinely different observation windows.
4. Trace the Supabase RPCs and `observed_at` boundaries.
5. Verify counts, source coverage, topics, regions and signal distributions.
6. Only after this passes, continue to deeper World Pulse / Trend DNA / event propagation work.

## Rollback

The V20 work is isolated on `feature/rallivio-v20-living-ecosystem`. Existing V18/V19 baselines are not replaced by this checkpoint.
