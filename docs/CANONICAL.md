# CANONICAL INDEX

**Last updated:** 2026-09-16

> **Every AI session reads this file FIRST.**
>
> If a document is not listed here as CURRENT, do not build from it.
> If you believe a listed document is wrong or outdated, say so in chat —
> do not silently choose a different file.

---

## Specifications

| Concern | Current document | Version | Updated |
|---|---|---|---|
| Master plan | `docs/RALLIVIO_MASTER_v2.md` | 2.0 | 2026-09-15 |
| Session entry point | `docs/AI_START_HERE.md` | 1.0 | 2026-09-15 |
| Living requirements & project state | `docs/RALLIVIO_STATE.md` | 1.0 | 2026-09-16 |
| Resilience & learning | `docs/RESILIENCE_SYSTEM.md` | 1.0 | 2026-09-15 |
| Kickoff instructions | `docs/KICKOFF_INSTRUCTIONS.md` | 1.0 | 2026-09-15 |
| Session log | `docs/SESSION_LOG.md` | 1.0 | 2026-09-16 |
| Known issues | `docs/KNOWN_ISSUES.md` | 1.0 | 2026-09-15 |
| Recovery checkpoints | `docs/RECOVERY_CHECKPOINTS.md` | 1.0 | 2026-09-16 |
| Living platform routing | `docs/specs/living-platform-routing-v1.md` | 1.0 | 2026-09-16 |
| Living Discover environment | `docs/specs/living-discovery-environment-v1.md` | 1.0 | 2026-09-16 |
| Discover hero | `docs/specs/discovery-hero-v2.md` | 2.0 | 2026-09-16 |
| Design system | `docs/DESIGN_SYSTEM.md` | — | not yet written |
| Discovery page | `docs/specs/discovery-page-v1.md` | — | not yet written |
| Data model | `docs/specs/data-model-v1.md` | — | not yet written |
| Signal engine | `docs/specs/signals-v1.md` | — | not yet written |
| Leaderboard (Phase 0) | `docs/specs/leaderboard-v1.md` | — | not yet written |
| Creator onboarding | — | — | not yet written |
| Brand matching | — | — | not yet written |

## Design assets

| Screen | Current file | Version | Updated |
|---|---|---|---|
| Discovery page / hero | `design/discovery-v2.svg` | 2.0 | 2026-09-16 |
| Homepage | `design/home-v1.png` | — | not yet added |
| Leaderboard | `design/leaderboard-v1.png` | — | not yet added |

## Superseded — DO NOT USE

| Old document | Replaced by | Date |
|---|---|---|
| `docs/RALLIVIO_RESTART_ROADMAP.md` | `docs/RALLIVIO_MASTER_v2.md` | 2026-09-15 |
| `design/discovery-v1.png` | `design/discovery-v2.svg` | 2026-09-16 |

## How to update this file

**When you create a new version of any spec or design:**

1. Add the new file with a version in its name (`discovery-page-v2.md`)
2. Move the old row to the Superseded table
3. Add a banner to the top of the old file:
   ```
   > ⚠️ SUPERSEDED on YYYY-MM-DD by docs/specs/discovery-page-v2.md
   > Do not build from this file. See docs/CANONICAL.md.
   ```
4. Update the Current table row to point at the new file
5. Update **Last updated** at the top of this file

All five steps happen in the same commit. A PR that adds a new spec without updating this index is incomplete and must not merge.

All recovery checkpoints are recorded in `docs/RECOVERY_CHECKPOINTS.md`. Code checkpoints remain Git commits; QA Preview deployments are runnable representations of those commits; production promotion is a separate release event.

## Naming rules

- ✅ `discovery-page-v3.md`
- ❌ `discovery-page-final.md`
- ❌ `discovery-page-new.md`
- ❌ `discovery-page-latest.md`
- ❌ `discovery-page-updated.md`

Version numbers only. Words like "final" and "latest" are how this system fails.

## Never delete

Superseded files stay in the repository. They move to the table above and get a banner. History is useful; ambiguity is not.
