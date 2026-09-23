# RALLIVIO World Intelligence — V19

## Product model

RALLIVIO is being evolved from a source-specific discovery dashboard into a world trend-intelligence system.

External platforms are sensors. RALLIVIO owns the normalization, correlation, temporal analysis, discovery presentation, and campaign intelligence layers.

## Signal flow

Internet sources
→ source adapters
→ normalized signals
→ entity/topic extraction
→ observations
→ cross-source event correlation
→ temporal trend scoring
→ Discover
→ legitimate submitted campaigns
→ RALLIVIO-owned promotion placements and analytics

## Source strategy

Initial and future adapters may include:

- YouTube
- Instagram
- X
- news/public feeds
- Reddit/public communities where permitted
- search/trend sources where permitted
- market data sources
- RSS/public feeds
- future sources without changing the intelligence contract

Each adapter must emit the same normalized signal shape. Source-specific payloads must not leak into ranking logic.

## Intelligence dimensions

RALLIVIO should evaluate:

- velocity — how quickly attention is changing
- acceleration — whether velocity itself is increasing
- cross-source propagation — whether an entity appears across independent sources
- geographic spread — how many regions are participating
- persistence — whether the signal survives multiple observations
- novelty — whether the event is new relative to available history
- engagement — source-specific interaction evidence where available

Missing observations are not treated as zero activity.

## Timeframes

The existing 15m / 1h / 1d / 1w / 1m model becomes a temporal intelligence layer:

- 15m: what is moving now
- 1h: what is accelerating
- 1d: what broke out today
- 1w: what became sustained
- 1m: what became a durable phenomenon

The underlying observation timestamps must remain authoritative. Frontend labels must never manufacture historical data.

## Organic discovery vs promotion

Organic discovery is generated from observed signals.

Promotion is a separately submitted campaign. A promoted campaign must never be represented as organic trend evidence.

A campaign may contain a URL, application, product, creator content, business, or another legitimate destination. RALLIVIO can classify the submitted item and select appropriate RALLIVIO-owned placements, subject to validation and platform/source rules.

## Implementation status in V19

- Generalized source adapter contract added.
- Normalized source metrics and observation timestamp added.
- Cross-source trend scoring engine added as a pure server module.
- Tests added for acceleration, empty evidence, source diversity, and grouping.
- Existing YouTube acquisition remains intact.
- No fake external-source data is introduced.

## Next implementation stages

1. Map the current Supabase observation/snapshot schema to the normalized signal contract.
2. Make YouTube emit normalized observations without changing its existing acquisition behavior.
3. Build a source registry and health/status model.
4. Add event/entity correlation with stable canonical keys.
5. Store trend evidence and score history.
6. Expose real Discover feeds from the intelligence layer.
7. Add new source adapters one at a time.
8. Add campaign submission/classification against the same intelligence context.
9. Evaluate the real deployed Discover experience after each milestone.

## Non-goals

- Do not scrape sources in ways that violate their access rules.
- Do not fabricate trends when a source has no data.
- Do not merge paid campaign signals into organic ranking.
- Do not replace source-specific truth with a single opaque score.
