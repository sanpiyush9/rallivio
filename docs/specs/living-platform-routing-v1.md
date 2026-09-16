# Living Platform Routing v1

**Status:** QA implementation
**Date:** 2026-09-16

## Purpose

The RALLIVIO front page is the cross-platform discovery field. The center is a living RALLIVIO core; platform nodes are entry points into platform-specific environments. Visual motion communicates state but does not create factual activity.

## 1. Platform registry

Each platform has a registry entry with:

- stable slug and display name
- real brand icon asset
- connection state
- platform environment route
- source adapter status

Current UI registry: YouTube, Instagram, TikTok, X, LinkedIn, Spotify, Twitch, Facebook, Pinterest, Reddit, Discord, Snapchat.

Only YouTube is currently source-connected. Unconnected platforms must show a truthful adapter-not-connected state rather than invented trends.

## 2. Platform click behavior

Clicking a platform node navigates to `/platform/{slug}`. That page owns the platform-specific visual language and data presentation. The home field does not pretend that every platform already has data.

## 3. Universal search

The home search is an intent entry point, not a YouTube search box. Resolution order is:

1. Explicit platform mention → open that platform environment with the query.
2. Known category → tune the shared discovery field to that category.
3. Creator / brand / opportunity intent → route to the corresponding RALLIVIO surface.
4. General query → search the verified discovery pool.

When more source adapters are connected, the same contract expands without changing the front-page interaction model.

## 4. Category behavior

Categories describe discovery intent, not source ownership. A category such as AI & Tech, Travel, Podcasts, Lifestyle, Finance, Sports, or Automotive should therefore not automatically mean YouTube.

The category selects a semantic discovery cell. The serving layer chooses candidates from connected sources that satisfy the cell's Region × Topic × Format × Signal constraints. Today the connected-source set contains YouTube, so YouTube supplies the evidence. Later, multiple adapters can contribute a deduplicated union of verified candidates.

## 5. Source selection rules

The future serving decision is:

`user intent → discovery cell → connected source adapters → verified candidate union → relevance → signal → diversity → serve`

Explicit platform intent has priority over the cross-platform source pool. Generic intent remains cross-platform. A source is eligible only when its adapter is connected, its data is verified, and it can satisfy the requested discovery cell.

## 6. Living interaction

The RALLIVIO core continuously pulses and dances through a restrained beat animation. Pointer/touch movement shifts the field with parallax; hovering a platform makes it respond; selecting a platform opens its environment. These effects are presentation only and must never imply unverified source activity.

## 7. Truth boundary

- No fabricated platform activity.
- No fake metrics.
- No platform shown as connected before its adapter is connected and verified.
- Source timestamps remain distinct from presentation animation.
- Home-level cross-platform claims must be backed by the connected-source set.
