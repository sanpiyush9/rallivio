# RALLIVIO V21 — Complete Living Ecosystem Phase Stack

## Checkpoint intent

This checkpoint completes the agreed living-ecosystem implementation stack on the V21 source-aware branch before visual/product QA is done one item at a time.

### Phase coverage

1. **Living Discover** — `/discover-v20` remains the public discovery surface with real observations, timeframe controls, event-first grouping, World Pulse, replay, event detail and Lens.
2. **Timeframe/data integrity** — 15m, 1h, 1d, 1w and 1M are preserved; the API uses `observed_at` and reports actual coverage instead of fabricating missing history.
3. **Living World** — `/api/intelligence/world` correlates YouTube observations with live open-web sensors and exposes source status, event propagation and world-event replay.
4. **Universal content layer** — normalized source items support video, short-video, live, article, post, feed, search, market and web source families without source-specific Discover cards.
5. **Trend Intelligence** — each world event has Trend DNA for attention, freshness, cross-source confirmation and momentum, plus an evidence-based “Why is this moving?” explanation.
6. **Campaign Network** — active RALLIVIO campaigns remain visibly distinct from organic observations and are surfaced as a promotion layer, not mixed into trend evidence.
7. **Final Discover direction** — the UI presents the system as a living world mesh: one event can contain multiple independent source signals; future adapters can be connected without redesigning the event layer.

## Current real connections

- YouTube discovery observations: live database-backed connection.
- Wikipedia pageview sensor: live open-web adapter.
- Hacker News top-story sensor: live open-web adapter.
- Authorized RSS: adapter boundary is supported.
- Instagram, X, TikTok, Reddit, market feeds: adapter-ready status is exposed until their permitted credentials/API access are configured.

RALLIVIO must not claim those adapter-ready sources are already ingesting data.

## Campaign/distribution boundary

Campaigns are legitimate submitted public URLs and are visually marked. External distribution remains an authorized action; RALLIVIO does not fabricate engagement or imply guaranteed virality.

## QA order after this checkpoint

Do not redesign the architecture first. Test the deployed system one-by-one:

1. data availability and API health;
2. timeframe integrity;
3. source/event grouping;
4. Trend DNA and Why explanation;
5. campaign distinction;
6. mobile/responsive behavior;
7. header/navigation and visual fidelity;
8. Creator and Brands & Opportunities integration;
9. authorized distribution flows;
10. performance and failure/empty states.
