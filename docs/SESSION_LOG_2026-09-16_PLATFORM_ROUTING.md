# Session Log — 2026-09-16 — Living Core + Platform Routing

## Request

The front page felt static and platform icons looked arbitrary. The requested correction was to make the RALLIVIO center feel alive, use real platform icons, make platform nodes navigable, and define how search/categories decide which platform data should respond as the ecosystem expands.

## Implementation

- Created a new `/discover` living front surface rather than destructively replacing the previous `/living` implementation.
- Root `/` now rewrites to `/discover`.
- RALLIVIO core now has continuous beat/pulse motion plus animated beat bars around the core.
- Pointer movement continues to create restrained parallax across the field.
- Platform nodes use real brand icon assets instead of arbitrary glyphs.
- Platform nodes now navigate to `/platform/{slug}`.
- Added a reusable platform-environment route for YouTube plus future platforms.
- YouTube environment reads the existing verified discovery endpoint.
- Other platform environments explicitly show adapter-not-connected state and do not fabricate activity.
- Universal search now distinguishes platform intent, category intent, creator/brand/opportunity intent, and general discovery queries.
- Categories are treated as discovery intent rather than belonging to one platform.
- Added a routing explanation on the front page so the current one-source state is visible.

## Architecture decision

The front page is cross-platform by intent. A category or generic search does not permanently bind the user to YouTube. The serving model is:

`intent → discovery cell → connected adapters → verified candidate union → relevance → signal → serve`

An explicit platform request overrides cross-platform selection and opens that platform environment. As additional verified adapters become available, they can join the candidate union without redesigning the front-page interaction model.

## Truth boundary

Only YouTube is source-connected at this checkpoint. Future platform nodes are navigable environments but must remain truthful until their source adapters are connected and verified.

## Recovery

Previous known-good front implementation remains intact on the parent feature branch `feature/youtube-real-discovery`. This iteration is isolated on `feature/living-core-platform-routing` so it can be discarded or fixed forward without rewriting the previous checkpoint.

## QA status

Vercel Preview is being generated for the new branch. Functional QA must verify: core beat visibility, real icon loading, every platform route, YouTube data route, truthful disconnected-platform state, search routing, category behavior, responsive layout, and no regression to `/api/discovery`.
