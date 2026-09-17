# RALLIVIO Creator — Checkpoint 1

**Date:** 2026-09-17  
**Workstream:** Creator only  
**QA branch:** `feature/creator-platform-subscription`  
**Production/main:** untouched

## Purpose

This is the first independent checkpoint for the RALLIVIO Creator workstream.

It is intentionally separate from the Discover/Living checkpoint. Creator changes must not be merged into, rebased onto, or otherwise alter the Discover/Living QA implementation unless an explicit future integration decision is made.

## Branch separation

### Creator

`feature/creator-platform-subscription`

Creator checkpoint scope:

- Public Creator Page
- Free vs RALLIVIO+ experience
- Creator platform switching
- Creator analytics presentation
- Historical analytics direction
- RALLIVIO Intelligence
- Opportunities
- Subscription UI
- Creator-specific header/navigation direction

### Discover/Living

`feature/living-position-editor`

Discover/Living remains its own QA workstream.

- Do not modify it as part of Creator work.
- Preserve its approved layout, canonical 12-platform geometry, coordinates, badge colors, and existing implementation unless a Discover-specific task explicitly requires a change.

### Production

`main`

- Do not touch directly during QA.

## Checkpoint 1 baseline

Creator branch currently points to:

`7f528b2e2a53eba7fbf84d3933575afc4f4977db`

Latest commit at checkpoint creation:

`docs: update Vercel self-healing runbook and issue log`

The Creator page implementation originated from:

`5c7803ad396733d644302d72468d82db92336b92`

Current Creator implementation file:

`app/creators/page.tsx`

## Creator product baseline

RALLIVIO has one creator identity across platforms. Platform switching changes the selected platform context; it does not create separate creator identities.

Free users should be able to genuinely:

- Discover
- Watch
- Follow
- Save/bookmark where supported
- View basic creator profiles
- View basic signals
- Search and use categories

RALLIVIO+ unlocks deeper:

- Analytics
- Historical intelligence
- Cross-platform intelligence
- RALLIVIO Intelligence
- Personalized recommendations
- Alerts
- Opportunities
- Collaboration/brand matching
- Advanced filters
- Reports/exports

Core subscription principle:

**Free = discovery. RALLIVIO+ = intelligence + personalization + depth + tools.**

## Creator checkpoint acceptance direction

Before moving beyond Checkpoint 1, Creator QA should verify:

1. Creator page loads independently.
2. Header visually follows the RALLIVIO Discover/Landing language.
3. Free experience remains useful rather than being entirely locked.
4. Premium sections visibly communicate their locked/subscriber state.
5. Platform switching changes the Creator context without changing the creator identity.
6. Analytics sections are clearly separated into platform data, RALLIVIO Intelligence, and opportunities.
7. Historical periods include the intended 7D / 30D / 90D / 1Y direction.
8. Responsive behavior is checked before deployment acceptance.
9. No Discover/Living files or behavior are changed by Creator work.
10. No production/main changes are made.

## Deployment checkpoint

A Creator checkpoint is not considered live merely because code exists on GitHub.

Required live QA gate:

1. Creator QA branch is the source.
2. Vercel preview is generated for that branch.
3. Deployment SHA exactly matches the intended Creator branch SHA.
4. Deployment state is `READY`.
5. Actual deployed URL is opened.
6. `/creators` is tested.
7. Only after those checks is the URL handed to the user for QA.

## Current deployment evidence

For the checkpoint SHA `7f528b2e2a53eba7fbf84d3933575afc4f4977db`, GitHub reports a successful Vercel status with description **Deployment has completed** and a Vercel target deployment page.

The Vercel connector has separately experienced authorization/tool-registry failures, so the exact public preview hostname still requires direct deployment verification before being recorded as the official Creator QA URL.

## Safety rule for future chats

When continuing Creator work:

- Read this checkpoint first.
- Inspect the actual Creator branch state before editing.
- Never assume Discover/Living changes are present on Creator.
- Never move Creator changes onto Discover/Living without explicit instruction.
- Never use an old Discover deployment as Creator QA proof.
- Update this checkpoint or create the next Creator checkpoint when a material Creator milestone is reached.

## Next checkpoint

**Creator Checkpoint 2** should be created after the first complete Creator QA pass and any required implementation fixes, with the exact commit SHA and verified deployment state recorded.
