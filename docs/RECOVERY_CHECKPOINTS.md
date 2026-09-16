# RALLIVIO — Recovery Checkpoints

> Purpose: preserve known-good project states so future changes can be tested without risking the last stable implementation.

## Recovery model

RALLIVIO uses three separate states:

1. **Feature branch** — active development. Every meaningful milestone is committed here first. This is where the owner and AI can experiment and fix defects without changing production.
2. **Staging / QA** — an integration checkpoint. A feature is promoted here only after its feature-branch implementation is ready for QA. The staging state is the candidate for acceptance.
3. **Production / main** — accepted release only. Production is not the place to save unfinished work or use as a scratchpad.

The repository's branch workflow is therefore also the recovery system:

`feature → QA Preview → staging → QA/acceptance → main/production`

## Checkpoint rules

- A meaningful requirement or UI milestone must end with a Git commit.
- A checkpoint commit must have a clear message describing what state it represents.
- Do not force-push or rewrite a checkpoint commit.
- Do not directly develop on `main` or `staging` after the bootstrap exception documented in the project rules.
- Do not promote temporary QA infrastructure, exposed development credentials, fake data, or unverified integrations to production.
- Before a risky architectural change, create a dedicated checkpoint commit so recovery can return to the previous known-good state.
- After QA finds a defect, fix forward on the feature branch; do not destroy the last known-good checkpoint.
- When a release is accepted, the production commit becomes an additional recovery anchor. Earlier accepted commits remain useful and must not be deleted.

## What is actually saved?

**The Git commit is the primary code checkpoint.**

The Vercel Preview deployment is the runnable QA representation of a feature-branch commit. It is useful for testing, but it is not the permanent source of truth; Git is.

The project documentation is saved in the same repository so that the code checkpoint and the explanation of that checkpoint travel together.

Supabase data is separate from Git. Database migrations/schema changes must be versioned in the repository, while live database contents are operational data and must not be treated as a code recovery mechanism.

## Current checkpoint — 2026-09-16

### Front simplification checkpoint

- **Branch:** `feature/youtube-real-discovery`
- **Commit:** `1afeba2993d5513b291017d08b6dbdd9607b6b11`
- **Commit:** `docs: record living front simplification`
- **Vercel Preview:** READY
- **Preview alias:** `rallivio-git-feature-youtube-real-discovery-san-eca6.vercel.app`
- **Production:** NOT PROMOTED

This checkpoint records the simplified RALLIVIO front direction:

- RALLIVIO is the clean interactive centre.
- Social-platform environments surround the centre.
- Platform nodes respond to pointer/touch/focus presentation.
- Random video/content nodes are removed from the central field.
- One universal search is the discovery entry point for creators, brands, videos, content, topics and platform intent.
- The category system covers the broader creator/content ecosystem while keeping the front rail compact.
- Live Signals is a dedicated, consistently formatted verified-data surface.
- YouTube is the connected source; other platform environments remain truthful boundaries until their adapters are implemented.
- Presentation motion is simulated; factual activity is not fabricated.

## How to recover if future work breaks the site

### If a feature branch breaks

1. Identify the last known-good checkpoint commit.
2. Compare the broken branch against that checkpoint.
3. Fix forward, or create a new recovery branch from the checkpoint if the feature is too damaged.
4. Never overwrite the checkpoint itself.

### If staging becomes corrupted

Recover staging from the last accepted staging/production checkpoint through a normal Git recovery process and then re-apply the intended feature through a PR. Do not use force-push as the first recovery method.

### If production is affected

Production recovery must start from the last known-good production commit and the deployment associated with it. Restore the code first, then investigate the failed release separately. Database recovery must follow the database migration/backup strategy rather than attempting to reconstruct live data from UI state.

## Release meaning

A feature being **saved** does not mean it is production-ready.

- **Saved:** committed to the feature branch.
- **QA-ready:** deployed as a Preview and passing automated checks appropriate to the change.
- **Accepted:** owner/user QA confirms the behavior and the change is approved for promotion.
- **Production:** merged through the protected release path and deployed as the accepted version.

This distinction prevents the common failure mode of treating the latest experimental code as the only copy of the product.

## Next checkpoint policy

Before the next substantial RALLIVIO functional change, preserve the current accepted front implementation as the recovery baseline. Then make the next change as an isolated feature, verify it, and create another explicit checkpoint before moving on.
