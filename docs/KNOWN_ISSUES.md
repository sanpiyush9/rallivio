# KNOWN ISSUES

> **Search this file before debugging anything.**
> Scan the index below for symptom keywords. If you find a match,
> read that entry before investigating from scratch.

## Index

| ID | Symptom keywords | Level | Status |
|---|---|---|---|
| KI-001 | dist, output directory, deployment fails after successful build | 3 | Resolved |
| KI-002 | eslint, nextVitals, not iterable, lint not enforced | 2 | Resolved |
| KI-003 | YouTube channel id, attribution redirect, validation | 2 | Resolved |
| KI-004 | insufficient observations, ranking too early, signal baseline | 2 | Resolved |

**Ladder levels** (see `docs/RESILIENCE_SYSTEM.md`):
0 unknown · 1 documented · 2 auto-detected · 3 auto-recovered · 4 prevented

## Maturity report

| Level | Count |
|---|---|
| 1 — Documented | 0 |
| 2 — Detected | 3 |
| 3 — Auto-recovered | 1 |
| 4 — Prevented | 0 |

> Update this table whenever an entry changes level.

---

## Entry template

```markdown
## KI-NNN — Short descriptive title
First seen: YYYY-MM-DD · Status: Open|Resolved · Ladder level: N → target N
Severity: LOW|MEDIUM|HIGH

### Symptom
What is observed, quoted exactly. Include the log excerpt.

### Cause
The confirmed cause. If not confirmed, write
"NOT YET CONFIRMED — run: <exact diagnostic command>"
Never write a speculative cause as though it were established.

### Fix
The steps that resolve it.

### Prevention
The specific change that would raise the ladder level.

### Related
Runbook entries and other KI ids.
```

---

## KI-001 — Vercel expects "dist", Next.js outputs ".next"
First seen: 2026-09-15 · Status: Resolved · Ladder level: 3 → target 4
Severity: HIGH

### Symptom
Vercel completed the Next.js build and prerendering successfully, then failed with:
`Error: No Output Directory named "dist" found after the Build completed.`

### Cause
The Vercel project was configured to expect `dist`, while the Next.js application produces `.next`.

### Fix
Added repository-level `vercel.json` declaring the Next.js framework and `.next` output directory. This makes the known mismatch self-correcting at deployment configuration level.

### Prevention
Keep Vercel's framework/build settings aligned with the repository and verify deployments through CI. Level 3 is reached because the repository now auto-recovers this known configuration mismatch. Level 4 would require preventing dashboard drift entirely.

### Related
`vercel.json`

---

## KI-002 — ESLint crashes silently during build
First seen: 2026-09-15 · Status: Resolved · Ladder level: 2 → target 2
Severity: HIGH

### Symptom
The Next.js build compiled successfully, but reported:
`⨯ ESLint: nextVitals is not iterable`
while continuing through page generation.

### Cause
The initial flat ESLint configuration loaded `eslint-config-next` in a shape that did not match the expected flat-config iterable form.

### Fix
Use `FlatCompat` from `@eslint/eslintrc`, load `next/core-web-vitals` and `next/typescript`, keep `next` and `eslint-config-next` aligned at 15.5.24, and run standalone `npm run lint` in CI.

### Prevention
Keep `eslint-config-next` and `next` aligned, run lint independently, and fail CI on lint/configuration errors.

### Related
None yet.

---

## KI-003 — Attribution validation rejected real YouTube channel IDs
First seen: 2026-09-15 · Status: Resolved · Ladder level: 2 → target 3
Severity: MEDIUM

### Symptom
The outbound attribution route initially limited YouTube IDs to 20 characters, which is too restrictive for real channel IDs.

### Cause
The validation pattern was copied from an assumed short identifier shape rather than accepting the actual channel ID format.

### Fix
Expanded the safe identifier validation to accept YouTube IDs up to 64 characters while retaining an allow-list of URL-safe characters.

### Prevention
Keep provider identifiers validated by documented character constraints, not guessed length assumptions. Add integration coverage when the attribution path is exercised against live provider IDs.

### Related
`app/api/attribution/route.ts`

---

## KI-004 — Ranking could be produced before enough observation history existed
First seen: 2026-09-15 · Status: Resolved · Ladder level: 2 → target 3
Severity: HIGH

### Symptom
A ranking computation could consider a creator before the minimum three observations needed for the Phase 0 signal history were present.

### Cause
The first scoring implementation counted recent videos but did not require each video in the sample to have three stored observations.

### Fix
The signal engine now requires at least three recent videos with at least three stored observations each before computing the audience-relative ranking.

### Prevention
Keep minimum-history gates in the scoring implementation and cover shrinkage/freshness/history requirements with deterministic tests.

### Related
`features/discovery/signals/compute.ts`
`tests/signals.test.ts`
