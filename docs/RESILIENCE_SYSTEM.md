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
