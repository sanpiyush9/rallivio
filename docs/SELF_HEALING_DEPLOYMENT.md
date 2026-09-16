# RALLIVIO Self-Healing Deployment

## Purpose

A QA change is **not considered live or visually verified** until the Git commit intended for the QA branch matches the Git commit actually deployed by Vercel.

This prevents stale Preview deployments from being mistaken for the latest code.

## Deployment verification gate

For QA branch `feature/living-position-editor`:

```text
Latest branch HEAD
       |
       v
Compare Git SHA
       |
       v
Latest READY Vercel deployment for the same branch
       |
       +---- SHA matches ----> LIVE / VERIFIED
       |
       +---- SHA differs ----> NOT LIVE
                              |
                              v
                         Recovery path
```

### Rule

Never mark a change `LIVE`, `READY FOR VISUAL QA`, or `VERIFIED` based only on a Vercel deployment being in `READY` state. The deployment must also identify the intended Git branch and commit SHA.

## Incident: 2026-09-16/17 QA deployment handoff

The latest QA commit was `87c8f19aa2c69989ccc0dd4cbe86a9fafba9347e`. GitHub confirmed the QA branch had moved to that SHA, while the latest Vercel deployment was still on `f817025...`. Therefore the latest QA change was not verified live.

The exact original cause was not proven. Possible boundaries were webhook delivery, Vercel build/skip behavior, Git integration/configuration, or another transient deployment handoff condition. Do not state an unverified cause as fact.

## Recovery procedure

1. Confirm the QA branch HEAD:

```bash
git ls-remote origin feature/living-position-editor
```

2. If the SHA is wrong, fix the branch ref/push first.
3. If the SHA is correct but no Vercel deployment exists, inspect Git/Vercel integration and webhook delivery.
4. Check Vercel Project → Settings → Git, especially connected repository, preview configuration, ignored build step, and branch configuration.
5. Check GitHub repository → Settings → Webhooks → Vercel Recent Deliveries.
6. If required, trigger a new QA Preview deployment.
7. Verify deployment state is `READY`, branch is correct, and deployed Git SHA equals branch HEAD.
8. Only then perform visual QA.

## External debugging lesson

The useful debugging order is:

**Branch HEAD → webhook/deployment trigger → Vercel build/skip configuration → SHA verification.**

A controlled empty commit can be used as a QA-only deployment-trigger test when appropriate:

```bash
git commit --allow-empty -m "chore: trigger qa deployment"
git push origin feature/living-position-editor
```

## Living UI visual QA lessons

The Living hero had a correct 12-point circle but initially exceeded the viewport. The correct fix was to constrain the square field against viewport height and vertically center the hero, rather than changing platform coordinates.

Preserve:
- canonical twelve coordinates;
- square `aspectRatio: 1 / 1` container;
- existing Simple Icons implementation and pinned version;
- no per-platform offsets or runtime geometry calculations.

Current viewport sizing pattern:

```css
width:min(100%,520px,58vh)
height:calc(100vh - 88px)
align-items:center
overflow:hidden
```

Hero copy may be enlarged/lifted independently without changing orbit geometry.

## Brand badge styling lesson

After layout is accepted, platform badges can use recognizable brand identity without altering geometry:

| Platform | Fill | Logo |
|---|---|---|
| YouTube | `#FF0000` | white |
| Instagram | `linear-gradient(45deg,#833AB4,#FD1D1D,#FCB045)` | white |
| TikTok | `#000000` | white + subtle white ring |
| X | `#000000` | white + subtle white ring |
| LinkedIn | `#0A66C2` | white |
| Facebook | `#1877F2` | white |
| Reddit | `#FF4500` | white |
| Discord | `#5865F2` | white |
| Snapchat | `#FFFC00` | black |
| Pinterest | `#E60023` | white |
| Spotify | `#1DB954` | black |
| Twitch | `#9146FF` | white |

Badge styling target:
- approximately `56px × 56px`;
- `border-radius:50%`;
- flex-center the existing logo;
- logo approximately `28px`;
- soft glow derived from brand hue;
- TikTok/X may use a thin `rgba(255,255,255,0.2)` ring because their black fills sit on a dark page.

**Do not change the existing Simple Icons path data or pinned package/version. Only badge fill/background and logo fill color should change.**

## QA safety rules

- QA branch only: `feature/living-position-editor`.
- Never modify production/main for visual experiments.
- Never change canonical platform coordinates to solve sizing problems.
- Never replace or upgrade pinned Simple Icons unless explicitly requested.
- When a visual issue appears, first classify it as geometry, container sizing, typography, styling, or deployment state before changing code.

## Self-healing acceptance criteria

A future workflow should report branch, expected SHA, deployed SHA, Vercel state, and deployment ID. A mismatch means **NOT LIVE** and should trigger the recovery path.
