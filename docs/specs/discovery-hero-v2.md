# RALLIVIO Discover Hero v2

**Status:** CURRENT / IMPLEMENTING  
**Date:** 2026-09-16  
**Reference:** `design/discovery-v2.svg`

## Authority

The registered reference asset is the visual authority for the Discover hero composition. Implementation should reproduce its hierarchy, proportions, spacing, orbital geometry, platform badge treatment, globe treatment, and supporting copy without inventing additional instructional UI.

## Platform badges

- Twelve bundled Simple Icons; no remote icon URLs.
- Perfect circular discs with brand-specific backgrounds and soft same-hue outer rings.
- YouTube `#FF0000`; Instagram uses the approved Instagram gradient treatment; TikTok/X black; LinkedIn `#0A66C2`; Facebook `#1877F2`; Reddit `#FF4500`; Discord `#5865F2`; Snapchat `#FFFC00` with a dark logo; Pinterest `#E60023`; Spotify `#1DB954` with a dark logo; Twitch `#9146FF`.
- YouTube is the only connected platform in the current truthful state. Other platforms show `Explore`.
- Platform configuration is typed and asserted at build time. Missing icon coverage fails verification.

## Hero geometry

- Desktop platform ring uses twelve points, exactly 30 degrees apart, beginning at -90 degrees with YouTube at 12 o'clock.
- The ring is an ellipse with a larger horizontal radius than vertical radius.
- The same computed `Rx`/`Ry` applies to every platform at a given viewport.
- Radius and badge size are recomputed on resize.
- The full ring must remain within the hero and above LIVE SIGNALS.
- Below 900px, the orbital ring/globe presentation is replaced by a responsive platform grid.

## Globe

The center is a luminous globe rather than a flat gradient sphere:

- latitude/longitude wireframe mesh;
- slowly rotating mesh;
- bright violet-white rim;
- monotonic radial luminosity with no dark eclipse band;
- surface particle points;
- multiple tilted elliptical orbital paths, partly visually in front/behind;
- static center text is a sibling layer to the animated globe and must not inherit its breath transform.

## Connectors

Faint curved connector paths run from the globe toward each platform. Their endpoints are calculated from the fixed geometric orbit coordinates rather than the animated globe layer.

## Interaction

Core touch/hover:

1. Globe brightens and scales approximately 4%; breath period shortens from 3.4s to 2.6s.
2. A connector pulse travels outward.
3. Platform badges scale approximately 6% with a small propagation delay.
4. YouTube remains visually connected; other platforms return to their resting state.
5. The system eases back without showing an instructional toast.

Platform touch sends the same visual pulse inward and briefly responds at the globe. The animation communicates interaction only and never represents unverified platform activity.

Animation must prefer transform and opacity. Per-frame filter/box-shadow animation is not part of the interaction contract. `prefers-reduced-motion` must still provide a state change without continuous motion.

## Supporting composition

- Top-right pill: `Real Platforms. Real Signals. A Brighter Tomorrow.`
- Far-right handwritten-style `Explore / Connect / Create / Grow` with underline flourish.
- Multi-row topic pills ending with `+ More`.
- No visible `Touch RALLIVIO · the whole ecosystem senses and responds` instruction.

## Verification

- Capture 1920px, 1280px and 390px screenshots.
- Confirm all twelve icons are bundled and render with no fallback state.
- Verify twelve angular positions differ by exactly 30 degrees.
- Verify the center text remains geometrically fixed during globe breathing.
- Verify the globe has no dark radial band and retains a bright center-to-edge falloff.
- Verify the ring and labels do not overlap LIVE SIGNALS at desktop widths.
- Verify the mobile grid has no horizontal overflow.
