# KNOWN ISSUES

> **Search this file before debugging anything.**
> Scan the index below for symptom keywords. If you find a match, read that entry before investigating from scratch.

## Index

| ID | Symptom keywords | Level | Status |
|---|---|---:|---|
| KI-001 | dist, output directory, deployment fails after successful build | 3 | Resolved |
| KI-002 | eslint, nextVitals, not iterable, lint not enforced | 2 | Resolved |
| KI-003 | Vercel Authentication, Preview SSO, 302, bootstrap blocked | 3 | Resolved for QA |
| KI-004 | Breaking Out, Just Dropped, signal mismatch, selected signal | 1 | Open |

**Ladder levels** (see `docs/RESILIENCE_SYSTEM.md`):
0 unknown · 1 documented · 2 auto-detected · 3 auto-recovered · 4 prevented

## Maturity report

| Level | Count |
|---|---:|
| 1 — Documented | 1 |
| 2 — Detected | 1 |
| 3 — Auto-recovered | 2 |
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

## KI-003 — Vercel Preview Authentication blocks QA bootstrap
First seen: 2026-09-15 · Status: Resolved for QA · Ladder level: 3 → target 4
Severity: HIGH

### Symptom
Requests to the Preview deployment, including `/api/qa/bootstrap`, were intercepted by Vercel and returned HTTP `302` to Vercel SSO instead of reaching the Next.js route.

### Cause
Vercel Authentication had **Require Log In** enabled for the project Preview deployment.

### Fix
During QA, the project owner disabled **Require Log In** under Vercel → RALLIVIO → Settings → Deployment Protection → Vercel Authentication and saved the setting. After the change, the same Preview bootstrap route returned HTTP `200` and executed the acquisition job.

### Prevention
Keep QA Preview access compatible with automated field testing, while protecting Production appropriately. Before production promotion, replace the temporary QA bootstrap with a proper secured operational mechanism and restore the appropriate deployment protection policy.

### Related
`app/api/qa/bootstrap/route.ts`
`docs/SESSION_LOG.md`

---

## KI-004 — Selected signal may not match displayed item signal
First seen: 2026-09-15 · Status: Open · Ladder level: 1 → target 3
Severity: MEDIUM

### Symptom
During live QA, the user tested the **Breaking Out** feed and observed a displayed video whose item metadata showed **Just Dropped**. The current evidence is a user screen recording; the exact code path causing the mismatch is not yet confirmed.

### Cause
NOT YET CONFIRMED — inspect `app/page.tsx` and `app/api/discovery/route.ts` together and trace selected-signal filtering, item metadata, and card rendering.

### Fix
Pending reproduction and root-cause confirmation.

### Prevention
Add automated coverage asserting that when a signal filter is selected, every returned/rendered item either matches that signal or is explicitly classified according to the documented feed contract. Never silently mix signal labels.

### Related
`app/page.tsx`
`app/api/discovery/route.ts`
`docs/RALLIVIO_STATE.md`
`docs/SESSION_LOG.md`
