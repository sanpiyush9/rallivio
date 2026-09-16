# Session Log — 2026-09-16 — Living Core + Platform Routing

## Request

The front page felt static, the beat treatment was awkward/out of position, and the platform icons did not feel authentic. The requested correction was to make the RALLIVIO center feel alive, use recognizable real platform brand assets, make platform nodes navigable, and define how search/categories decide which platform data should respond as the ecosystem expands.

## Visual refinement

- Reworked the central RALLIVIO beat into a centered radial equalizer ring. Bars are mathematically positioned around the core rather than appearing as loose strokes below it.
- Added a restrained core breathing/dance motion and synchronized beat pulses so the center reads as alive without becoming a distracting game effect.
- Kept pointer/touch parallax subtle and centered on the ecosystem field.
- Platform nodes remain evenly distributed around the ecosystem ring and enlarge/respond on hover/touch.
- Platform icon rendering now uses the platform's real Simple Icons asset by slug rather than arbitrary text glyphs. The asset source is centralized in `iconUrl()` so it can later be replaced with bundled/approved brand assets without changing routing logic.
- Preserved the generated visual direction: dark cinematic background, luminous blue/violet core, connected orbital rings, platform ecosystem, left discovery controls, and horizontal live-signal cards.

## Interaction contract

- Clicking a platform opens `/platform/{slug}`.
- YouTube is the currently connected source and reads verified observations from `/api/discovery`.
- Other platform routes are intentionally truthful adapter-not-connected environments until their source adapters are implemented and verified.
- Universal search remains an intent resolver: explicit platform → platform environment; category → discovery cell; creator/brand/opportunity → corresponding RALLIVIO surface; general query → verified discovery pool.
- Categories remain source-neutral. A category does not permanently mean YouTube. The serving layer chooses from connected, verified adapters that satisfy the discovery cell.

## Truth boundary

Visual motion is presentation, not evidence. No animation, icon, platform state, metric, trend, or signal is allowed to imply unverified source activity.

## Recovery

The parent `feature/youtube-real-discovery` branch remains the previous known-good front implementation. This work is isolated on `feature/living-core-platform-routing`; it can be reverted or fixed forward without rewriting that checkpoint.

## QA status

A new Preview deployment must verify the refined radial beat positioning, icon loading, all platform routes, YouTube data, disconnected-platform truth state, search/category routing, responsive behavior, and `/api/discovery` regression safety before promotion.
