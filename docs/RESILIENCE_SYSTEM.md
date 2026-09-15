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
