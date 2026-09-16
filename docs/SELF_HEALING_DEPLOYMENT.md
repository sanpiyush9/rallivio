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

### Observed condition

The latest QA commit was:

`87c8f19aa2c69989ccc0dd4cbe86a9fafba9347e`

Commit message:

`fix: reduce living discovery orbit scale`

The commit changes `app/living/layout.tsx` and adds the requested 78% visual scale to the Living field. The canonical platform coordinates and icons were not changed by this commit.

GitHub confirms that `feature/living-position-editor` currently points to SHA `87c8f19aa2c69989ccc0dd4cbe86a9fafba9347e`.

The latest Vercel deployment available for that branch was still:

`dpl_8z6erGTZwYPHm6z2s3g8YTMQhEWo`

with deployed Git SHA:

`f8170257128dcdd47024124946b97f9de2b609c4`

Therefore the latest QA change was **not verified live** at that point.

### What this ruled out

The first suspected failure mode was that the GitHub commit existed but the branch reference had not moved. That is **not the case**: the branch HEAD is `87c8f19...`.

### Remaining investigation boundary

The available evidence does not prove whether the missing deployment was caused by:

1. GitHub not delivering a Vercel webhook/event,
2. Vercel receiving the event but skipping the build,
3. a Vercel Git integration/configuration issue, or
4. another deployment handoff condition.

Do not state one of these as the root cause without delivery/configuration evidence.

## Recovery procedure

1. Confirm the QA branch HEAD:

```bash
git ls-remote origin feature/living-position-editor
```

2. If the SHA is not the intended commit, fix the branch ref/push first.

3. If the SHA is correct but no Vercel deployment exists, inspect the Vercel/Git integration and webhook delivery.

4. Check Vercel Project → Settings → Git, especially:
   - connected repository
   - preview deployment configuration
   - ignored build step
   - branch configuration

5. Check GitHub repository → Settings → Webhooks → Vercel Recent Deliveries.

6. If required, trigger a new Preview deployment through an approved Vercel/Git workflow.

7. After deployment, verify:
   - deployment state is `READY`
   - deployment branch is the intended QA branch
   - deployment Git SHA equals branch HEAD

8. Only then perform visual QA.

## Important lesson from external debugging review

A useful debugging order is:

**Branch HEAD → webhook delivery → Vercel build/skip configuration.**

This isolates the failure boundary quickly and avoids changing application code to compensate for a deployment problem.

An empty commit can also be used as a controlled deployment-trigger test when appropriate:

```bash
git commit --allow-empty -m "chore: trigger deploy"
git push origin feature/living-position-editor
```

Do this only on the QA branch and only when a new deployment trigger is actually desired.

## New lesson: viewport-constrained visual sizing

The 78% field transform was a temporary visual-scale workaround. It reduced the rendered orbit but did not solve the underlying layout constraint: the square field was still sized from the full width of its grid column, so the hero could become taller than the available viewport and leave excessive vertical dead space or clip the lower platform label.

For the Living hero, preserve the canonical platform geometry and instead constrain the **square field itself** against viewport height:

```css
width:min(100%,560px,62vh)
```

The hero should use a viewport-aware minimum height and centered two-column alignment:

```css
min-height:calc(100vh - 88px)
display:flex
align-items:center
justify-content:space-between
```

The field and ecosystem wrapper must allow visible overflow so the 92% Pinterest badge and label are not clipped. Do **not** move platform coordinates to compensate for viewport sizing.

This is a layout correction, not a geometry correction. The twelve canonical coordinates, square aspect ratio, and platform icon implementation remain unchanged.

## Current recovery change

On `feature/living-position-editor`, commit:

`4de6ad2a93ad56886573d8970fae4b959950f837`

changes the Living layout to:

- remove the temporary `.field` scale transform;
- constrain the field to `min(100%, 560px, 62vh)`;
- center the hero columns vertically;
- give the ecosystem and field visible overflow;
- keep the canonical twelve platform positions unchanged.

## Self-healing acceptance criteria

A future self-healing workflow should:

- identify the exact intended Git SHA;
- identify the exact branch;
- find the latest Vercel deployment for that branch;
- require `READY` state;
- compare the Vercel Git SHA with the intended Git SHA;
- reject stale deployments;
- attempt the documented recovery path when the SHA does not match;
- re-check after recovery;
- report the exact Git SHA and Vercel deployment ID in the final status.

### Example status

```text
Branch: feature/living-position-editor
Expected SHA: 87c8f19...
Deployed SHA: f817025...
Vercel state: READY

STATUS: NOT LIVE
REASON: READY deployment is stale; Git SHA mismatch.
```

A successful result must look like:

```text
Branch: feature/living-position-editor
Expected SHA: <sha>
Deployed SHA: <same sha>
Vercel state: READY

STATUS: LIVE / VERIFIED
```
