# RALLIVIO Living Discovery Environment v1

**Status:** CURRENT / IMPLEMENTING  
**Date:** 2026-09-16

## Purpose

RALLIVIO should feel like a living discovery environment rather than a static analytics dashboard. Real verified platform data determines what exists and how it is ranked; client-side motion and interaction determine how that state is experienced.

## Core principle

> **Real data determines reality. Simulation determines presentation.**

Simulation must never invent creators, videos, metrics, rankings, freshness, engagement, or platform activity.

## Experience model

`Source data → verified discovery state → RALLIVIO signals → visual environment → interaction → deeper discovery`

The environment may use:

- real thumbnails and video embeds
- animated position/scale/opacity transitions derived from signal strength
- connected topic/creator/video relationships when those relationships are supported by data
- subtle pointer/touch response
- periodic refresh of persisted discovery data
- platform-specific visual behavior later

## Home / Discover v1

The first implementation keeps the current Discover information architecture but adds a living signal field around the primary content:

1. Signal selector remains the truth boundary.
2. Verified discovery items become visual nodes.
3. Momentum score influences node prominence only; it does not create new data.
4. The selected video becomes the visual focus.
5. Related verified items form the surrounding discovery field.
6. Pointer/touch proximity may gently shift nodes and focus without changing their underlying ranking.
7. Selecting a node changes the real selected item and player.
8. Motion pauses or becomes static under `prefers-reduced-motion`.
9. Mobile uses touch/click interactions; hover is enhancement only.

## Signal environments

The same data engine can later render platform-specific environments:

- **YouTube:** video → creator → topic → momentum
- **Instagram:** visual post/reel → creator → visual trend
- **X:** conversation → topic → people → velocity
- **TikTok:** short video → creator → sound/topic → acceleration
- **LinkedIn:** expertise → creator → topic → professional momentum
- **Twitch:** live stream → creator → community → live activity

Platform environments must consume normalized verified data rather than inventing separate truth systems.

## Live-feeling behavior

"Live" means the environment responds to changing verified state. It does not require fake second-by-second metrics. The first implementation refreshes persisted discovery data on a bounded interval and animates only the transition between known states.

## Interaction rules

- Hover can enhance but never be required.
- Click/tap is the primary selection mechanism.
- Keyboard focus remains usable.
- Broken/unavailable embeds must advance to another verified candidate.
- Empty states remain truthful.
- No animation may imply a metric that is not present in the source/derived evidence.

## Progressive roadmap

### V1 — Living Discover field

Implement now: real thumbnails, signal-driven node field, focus transitions, pointer/touch response, selected-video playback, responsive layout, reduced-motion support.

### V2 — Discovery graph

Add verified creator/topic relationships and discovery chains.

### V3 — Multi-platform environments

Add normalized adapters for Instagram, X, TikTok and later platforms; each platform gets its own visual grammar while sharing the RALLIVIO intelligence layer.

### V4 — Continuous ecosystem

Add recurring acquisition, historical observations, stronger acceleration/baseline models, trend transitions, opportunities and creator/brand pathways.

## Acceptance criteria

- Real source records remain the only content nodes.
- Changing a signal changes the candidate set, not merely its visual label.
- Motion responds to state but never fabricates state.
- Selected content remains identifiable and playable through the official source.
- The environment remains usable on desktop and mobile.
- Reduced-motion users receive a useful static equivalent.
- The design feels dynamic without becoming a game or decorative dashboard.
