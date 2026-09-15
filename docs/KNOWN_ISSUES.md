# KNOWN ISSUES

> **Search this file before debugging anything.**
> Scan the index below for symptom keywords. If you find a match,
> read that entry before investigating from scratch.

## Index

| ID | Symptom keywords | Level | Status |
|---|---|---|---|
| KI-001 | dist, output directory, deployment fails after successful build | 1 | Open |
| KI-002 | eslint, nextVitals, not iterable, lint not enforced | 2 | Resolved |

**Ladder levels** (see `docs/RESILIENCE_SYSTEM.md`):
0 unknown · 1 documented · 2 auto-detected · 3 auto-recovered · 4 prevented

## Maturity report

| Level | Count |
|---|---|
| 1 — Documented | 1 |
| 2 — Detected | 1 |
| 3 — Auto-recovered | 0 |
| 4 — Prevented | 0 |

> Update this table whenever an entry changes level.
> If most entries stay at level 1, the project is accumulating
> documentation rather than becoming more robust.

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
The specific change that would raise the ladder level, and what
level that reaches. If level 4 is not achievable, state why.

### Related
Runbook entries and other KI ids.
```

---

## KI-001 — Vercel expects "dist", Next.js outputs ".next"
First seen: 2026-09-15 · Status: Open · Ladder level: 1 → target 4
Severity: HIGH

### Symptom
Vercel completed the Next.js build and prerendering successfully, then failed with:
`Error: No Output Directory named "dist" found after the Build completed.`

### Cause
The Vercel project was configured to expect an output directory named `dist`, while the Next.js application produces its build output in `.next`.

### Fix
Remove the `dist` output-directory override from the Vercel project, or configure the project for the output produced by the Next.js build. The repository should not be changed to emit `dist` solely to satisfy an incorrect Vercel setting.

### Prevention
Keep Vercel's Next.js framework/build settings aligned with the repository and verify a production build through CI before promoting a deployment. Target level 4 is achievable by making the deployment configuration structurally match Next.js output.

### Related
None yet.

---

## KI-002 — ESLint crashes silently during build
First seen: 2026-09-15 · Status: Resolved · Ladder level: 2 → target 2
Severity: HIGH

### Symptom
The Next.js build compiled successfully, but the build reported:
`⨯ ESLint: nextVitals is not iterable`
while continuing through page generation. This means linting was not successfully enforced by the build step.

### Cause
The flat ESLint configuration imported `eslint-config-next` configuration modules in a shape that did not match the iterable flat-config form expected by `defineConfig`.

### Fix
Use `FlatCompat` from `@eslint/eslintrc` to load `next/core-web-vitals` and `next/typescript`, keep `next` and `eslint-config-next` aligned at 15.5.24, and run the standalone `npm run lint` check in CI.

### Prevention
Keep `eslint-config-next` and `next` versions aligned, test `npm run lint` independently, and make CI fail on lint/configuration errors. Level 2 is reached because CI now detects and reports this failure before deployment.

### Related
None yet.
