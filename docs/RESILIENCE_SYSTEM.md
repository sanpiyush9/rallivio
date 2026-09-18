# RALLIVIO — Resilience & Learning System

**Version:** 1.0  
**Status:** CURRENT  
**Parent document:** `docs/RALLIVIO_MASTER_v2.md`

---

## The idea

Every problem the system encounters gets captured, and over time each problem moves from "nobody knew" to "cannot happen again." The system gets more robust through disciplined capture and by moving failure modes up the maturity ladder.

## The maturity ladder

| Level | State | What happens when it occurs | Who acts |
|---|---|---|---|
| **0** | Unknown | Nobody knows why. Debugging from scratch. | Human, slowly |
| **1** | Documented | `KNOWN_ISSUES.md` has the symptom, cause and fix. | Human, quickly |
| **2** | Detected | System notices and alerts with a diagnosis. | Human, immediately |
| **3** | Auto-recovered | System handles it and logs what it did. | System |
| **4** | Prevented | Structurally impossible. | Nobody |

**Aim for Level 4 where possible, Level 3 where recovery is deterministic, Level 2 where a human must decide. Level 1 is the floor — every problem gets at least documented.**

## What can genuinely auto-recover

Auto-recovery is only safe when the correct response is deterministic and known in advance.

| Condition | Detection | Automatic response |
|---|---|---|
| YouTube quota exhausted | 403 `quotaExceeded` | Stop acquisition, serve from pool, alert, resume next quota window |
| API timeout / 5xx | Request error | Exponential backoff, 3 retries, then mark source degraded |
| Pool cell below threshold | `pool_health` check | Queue that cell for next acquisition pass |
| Stale stats | `captured_at` age check | Suppress the signal label, keep content, log it |
| Video embed fails | Player error event | Mark unavailable, advance queue, flag for revalidation |
| Video deleted at source | 404 on refresh | Remove from pool, log removal |
| Duplicate in feed | Dedup check | Drop, log the collision source |
| Supabase connection lost | Connection error | Retry with backoff, serve cached, alert if over 60s |

Never auto-recover by fabricating content, metadata, metrics, signal labels, or code changes.

## The capture protocol

Every failure follows this sequence:

1. **Record the incident before fixing it.** Capture the observed symptom and log excerpt.
2. **Fix, then codify in three places:** a regression test, a `KNOWN_ISSUES.md` entry, and a ladder decision.
3. **Move it up the ladder:** ask whether detection, deterministic recovery, or structural prevention is possible.
4. **Update the `KNOWN_ISSUES.md` index and maturity report.**

A fix is not finished until the symptom is gone, a test catches recurrence, the issue is documented, and its target ladder level is stated.

## Health checks

A scheduled health job should check:

- pool size per active cell vs threshold
- oldest snapshot age per cell
- quota units consumed today vs budget
- acquisition worker last successful run
- error rate over the last hour
- percentage of served feeds requiring fallback
- percentage of candidates with suppressed signal labels

Degradation states must be declared honestly: Normal, Reduced, Degraded, Limited, or Down. Never skip a state to make the product look healthier than it is.

## Runbook rule

`RUNBOOK.md` is symptom-first, not cause-first. It should grow from real incidents rather than speculative troubleshooting. Every entry should link related `KI-*` issues so the runbook and issue register reinforce each other.

## What this system is not

It is not an AI that repairs itself. Automatic responses are deterministic handlers designed in advance for recognized conditions. Novel failures start at Level 0 and still require investigation and review.

## Implementation order

1. `KNOWN_ISSUES.md` with the level column
2. Capture protocol: test + issue + ladder decision
3. `system_health` checks and scheduled job
4. Deterministic handlers for known conditions
5. Honest degradation states in the UI
6. `RUNBOOK.md`, grown from real incidents

## Measure of success

The important maturity metric is how many documented issues have reached Level 3 or 4, not how large the issue file has become.


## 2026-09-18 — Checkpoint integrity incident and prevention rule

### Incident
An existing checkpoint branch, `checkpoint/living-front-v10`, was moved from its original SHA `785b8c305708bf9d495601cf74b81728941c82f5` to the latest implementation SHA `82a1a391b9505da02d62be7e52625f4e2a2a470a` when a new checkpoint was requested. This violated the project rule that checkpoints are immutable recovery points.

### Recovery
The original SHA remains in Git history and was preserved explicitly with the immutable archive branch `archive/checkpoint-living-front-v10-original`. The v10 branch now represents the latest state and must not be moved again. Future new checkpoints must use the next unused version, v11, v12, etc.

### Prevention
- Before every checkpoint operation, enumerate existing checkpoint branches.
- Never call a branch-update operation for an existing checkpoint branch.
- Create a new branch from the current feature HEAD using the next unused checkpoint version.
- Verify the new checkpoint SHA after creation.
- If a checkpoint is accidentally moved, immediately preserve the prior SHA in a uniquely named archive branch and document the incident.

### Target ladder
**Level 4 — Prevented.** The workflow is now explicitly documented as a structural precondition: existing checkpoint refs are immutable and checkpoint creation must use a new version.

### Related
- `docs/AI_START_HERE.md`
- `docs/RALLIVIO_STATE.md`
- `docs/SESSION_LOG.md`


## 2026-09-19 — Discover build import failure: LinkedIn icon exception

### Incident
The Discover hero/header + 3D ecosystem pass introduced an import of `siLinkedin` from `simple-icons`. The installed package does not export that symbol, so Vercel's production build failed during TypeScript validation.

### Diagnosis
The actual Vercel log, rather than the generic `import_error` classification, identified the exact failure:
`"simple-icons" has no exported member named 'siLinkedin'`.

The repository already contained a LinkedIn local-exception path in `scripts/check-platform-icons.mjs`; the page implementation failed to honor that contract.

### Deterministic recovery
Replace the invalid package import with the existing local LinkedIn path, then run the platform-icon prebuild check and full production build before deployment.

### Prevention
The platform-icon prebuild check now also inspects `app/page.tsx` and fails if `siLinkedin` is imported. This moves the failure from a late Next.js build/type-check failure to an earlier deterministic prebuild diagnostic.

### Ladder
**Level 3 — Detected / deterministic recovery, target Level 4.** The recovery is deterministic and the prebuild gate detects recurrence before Next.js compilation.

### Related
`docs/KNOWN_ISSUES.md` → KI-008
`docs/SESSION_LOG.md`


## 2026-09-19 — External integration fallback: Vercel build logs unavailable

### Incident
The Vercel integration exposed deployment metadata but the build-log capability returned `Tool get_deployment_build_logs not found`. Reconnection did not restore that specific capability.

### Recovery rule
When a required integration capability is unavailable:
1. Identify the exact unavailable capability.
2. Do not guess or make production changes based on missing evidence.
3. Check whether the same evidence can be obtained through an approved alternative path (for example, repository CI/workflow logs or a local reproducible build).
4. If equivalent evidence is available, use it and record the fallback source.
5. If no equivalent evidence exists, immediately tell the owner which integration/capability needs reconnection and stop diagnosis until access is restored.
6. Record material integration outages in `SESSION_LOG.md` and this document.

### RALLIVIO application
For deployment/build failures, GitHub Actions is an approved evidence fallback because `npm run verify` executes the project's typecheck, lint, tests, production build, canonical check and documentation check. This fallback must not be treated as proof of Vercel-specific runtime behavior; Vercel deployment verification is still required after the repository verification passes.

### Related
- `docs/SESSION_LOG.md`
- `docs/KNOWN_ISSUES.md`
- Vercel deployment build-log capability

## 2026-09-19 — DiscoverGlobe TypeScript failure: deterministic fix

### Incident
After the LinkedIn import failure was fixed, the next CI verification exposed a separate TypeScript error in `components/DiscoverGlobe.tsx`: `Property 'setTimeout' does not exist on type 'never'` at line 226.

### Confirmed cause
The expression checking `"requestIdleCallback" in window` was narrowed by TypeScript because the DOM type already declares that property. The fallback branch therefore became `never`, making `window.setTimeout` invalid.

### Deterministic recovery
Use runtime function checks (`typeof window.requestIdleCallback === "function"`) and use `globalThis.setTimeout` for the fallback. Apply the same pattern to `cancelIdleCallback`/ `globalThis.clearTimeout` during cleanup.

### Verification
The subsequent workflow confirmed that typecheck completed, lint completed with warnings only, tests passed, the Next.js production build compiled and generated all 22 static pages, and canonical checks passed. The remaining failure was documentation enforcement because the KNOWN_ISSUES index and SESSION_LOG were stale; this is a documentation consistency issue, not a DiscoverGlobe code failure.

### Ladder
**Level 3 — Detected / deterministic recovery, target Level 4.** The failure is now documented and the code pattern is deterministic. A stronger prevention rule can be added to a static lint/check if this browser-API pattern recurs.

### Related
- `docs/KNOWN_ISSUES.md` → KI-009
- `docs/SESSION_LOG.md`
- `components/DiscoverGlobe.tsx`


## 2026-09-19 — Served-route verification rule for Discover UI

### Incident
The root URL is rewritten by `middleware.ts` to `/living`. Earlier Discover visual changes were implemented in `app/page.tsx`, which built successfully but was not the actual page the user was viewing.

### Recovery rule
For UI incidents, verify the served route before editing the visual component:
1. Inspect middleware/rewrites/redirects.
2. Confirm the URL's matched route in deployed HTML or deployment metadata.
3. Confirm the requested visual component exists in that route's source file.
4. Only then modify code and report the exact served file.

### Prevention
A visual QA pass is not complete until the tested URL, matched route, source file, commit SHA and deployed SHA are all recorded. A successful build of a different route is not evidence that the user-visible page changed.

## 2026-09-19 — Binary asset limitation must be explicit

The live 3D globe now uses the Three.js Earth assets from upstream raw GitHub URLs. The requested local `/public/textures` copies were not silently represented as complete because the current GitHub connector exposes UTF-8 text-file writes but not binary repository-file uploads through the available file-update path. When binary asset tooling becomes available, localize the three Earth assets and update `components/DiscoverGlobe.tsx`; until then this remains a documented follow-up.


## 2026-09-19 — Build-evidence fallback order strengthened

### Build-evidence sources, in order

1. **Local production build — always try this first**
   ```bash
   git checkout <failing-sha>
   rm -rf .next node_modules && npm ci
   npm run build 2>&1 | tee build.log
   npx tsc --noEmit
   ```
   Same Node/dependencies and the same Next.js production build path as Vercel. Reproduces parse, compile and type failures with full local output, needs no integration, and costs no deployment quota.

2. Vercel build logs (connector or dashboard)
3. GitHub Actions workflow logs
4. Only if all three are unavailable: stop and request reconnection

**Rule:** an unavailable connector is not a blocker when the same evidence is obtainable another way. Before declaring work blocked, confirm no equivalent source exists. "Tool unavailable, work stops" and "tool unavailable, evidence obtainable locally" are different situations.

### 2026-09-19 — JSX build incident
The /living build failure at app/living/page.tsx:391 was diagnosed from the Vercel log after the connector build-log capability was unavailable. The first error block showed an orphaned /span> parse error. Commit 8578ca555e97707f5ff01ea0b0ba36d6b08fb453 had already removed that exact line. This incident reinforces that the local production build must be the first fallback before connector troubleshooting.

## 2026-09-19 — Discovery deployment failure: malformed CSS tail in app/living/page.tsx

### Incident
The discovery/platform-badge implementation reached Vercel as an ERROR deployment and GitHub verification also failed. The Vercel deployment metadata reported only the generic build classification: `lint_or_type_error`, `npm run build` exited with 1. Because the Vercel build-log capability was unavailable, the approved GitHub Actions fallback was used.

### Confirmed cause
GitHub Actions run `35401884156` for commit `4a81db4da8bcee365255cfacfd21b1f7e44a2a2a` provided the first concrete error during `npm run typecheck`:
- `app/living/page.tsx(764,1): TS1127 Invalid character`
- `app/living/page.tsx(764,10): TS1005 ';' expected`
- `app/living/page.tsx(765,2): TS1127 Invalid character`

Inspection of the exact source showed a malformed CSS tail containing literal escaped newline characters and an extra empty `<style>` fragment after the CSS template literal. This was the immediate build blocker.

### Deterministic recovery
Removed the malformed trailing fragment from `app/living/page.tsx` and committed:
`eb01419aa7dc4aee80695c9030ce5094217e218e` — `Fix invalid badge CSS block`.

### Prevention
For large CSS/template-literal edits in `app/living/page.tsx`:
1. Keep CSS inside the intended template literal only.
2. Never append escaped literal `\\n` text or a second `<style>` fragment outside the existing style mechanism.
3. Run typecheck before treating the visual change as deployment-ready.
4. If Vercel build logs are unavailable, retrieve the first failing CI step/log before making another code change.

### Ladder
**Level 3 — Detected / deterministic recovery, target Level 4.** CI catches invalid characters before deployment; the exact malformed-tail pattern is now documented for recurrence prevention.

