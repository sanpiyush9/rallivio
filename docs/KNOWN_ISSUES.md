# KNOWN ISSUES

> **Search this file before debugging anything.**
> Scan the index below for symptom keywords. If you find a match, read that entry before investigating from scratch.

## Index

| ID | Symptom keywords | Level | Status |
|---|---|---:|---|
| KI-001 | dist, output directory, deployment fails after successful build | 3 | Resolved |
| KI-002 | eslint, nextVitals, not iterable, lint not enforced | 2 | Resolved |
| KI-003 | Vercel Authentication, Preview SSO, 302, bootstrap blocked | 3 | Resolved |
| KI-004 | Breaking Out, Just Dropped, signal mismatch, selected signal | 1 | Open |
| KI-005 | useSearchParams, Suspense, /login prerender, CSR bailout | 2 | Resolved |
| KI-006 | checkpoint branch moved, immutable recovery point | 4 | Resolved |
| KI-007 | Earth hidden, leaf-like globe, Pulse controls, radar alignment, static topics/creators | 2 | Resolved |
| KI-008 | simple-icons, siLinkedin, Discover build, import error | 3 | Resolved |
| KI-009 | DiscoverGlobe, setTimeout, never, TypeScript, CI | 3 | Resolved |
| KI-010 | JSX syntax, orphaned /span>, living page build | 1 | Resolved |
| KI-011 | Vercel build-log connector, Tool get_deployment_build_logs not found | 2 | Open |
| KI-012 | Vercel cron validation, no deployment record, Hobby, sub-daily cron | 2 | Resolved |
| KI-013 | stale Preview data, no acquisition activity, 25-row seed, request-time YouTube acquisition | 3 | Resolved |

**Ladder levels** (see `docs/RESILIENCE_SYSTEM.md`):
0 unknown · 1 documented · 2 auto-detected · 3 auto-recovered · 4 prevented

## Maturity report

| Level | Count |
|---|---:|
| 1 — Documented | 2 |
| 2 — Detected | 5 |
| 3 — Auto-recovered | 5 |
| 4 — Prevented | 1 |

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

---

## KI-005 — Login page useSearchParams requires a Suspense boundary
First seen: 2026-09-18 · Status: Resolved · Ladder level: 2 → target 4
Severity: HIGH

### Symptom
CI typecheck and lint completed successfully, but the production build failed while prerendering `/login` with:
`useSearchParams() should be wrapped in a suspense boundary at page "/login"`.

### Cause
`app/login/page.tsx` called `useSearchParams()` directly from the page-level client component. Next.js 15 requires the client subtree using `useSearchParams` to be behind a Suspense boundary during prerendering.

### Fix
Kept the interactive login UI client-side, moved the `useSearchParams` consumer into `LoginContent`, and wrapped it with React `<Suspense>` from the page component.

### Prevention
For Next.js App Router pages, always place page-level `useSearchParams` consumers behind a Suspense boundary, and keep `npm run build` in the verification pipeline so prerender-only failures are caught before deployment.

### Related
`app/login/page.tsx`
`docs/SESSION_LOG.md`


## KI-006 — Existing checkpoint branch was moved instead of creating a new checkpoint
First seen: 2026-09-18 · Status: Resolved with archive preservation · Ladder level: 4 → target 4
Severity: HIGH

### Symptom
An existing `checkpoint/living-front-v10` branch was moved to a newer commit when the owner requested a checkpoint, instead of creating a new checkpoint version.

### Cause
The checkpoint workflow did not enforce the precondition that checkpoint refs are immutable and that a new checkpoint request must select the next unused version.

### Fix
The original v10 SHA `785b8c305708bf9d495601cf74b81728941c82f5` was preserved in `archive/checkpoint-living-front-v10-original`. The v10 branch now points at `82a1a391b9505da02d62be7e52625f4e2a2a470a`; no further movement is permitted.

### Prevention
Before every checkpoint operation, enumerate checkpoint branches, select the next unused version, create a new branch from the current feature HEAD, verify the new branch SHA, and never update an existing checkpoint ref.

### Related
`docs/AI_START_HERE.md`
`docs/RALLIVIO_STATE.md`
`docs/RESILIENCE_SYSTEM.md`

## KI-007 — Living Field lower-surface visual/data presentation defects
First seen: 2026-09-18 · Status: Resolved · Ladder level: 2 → target 3
Severity: MEDIUM

### Symptom
Live field QA showed the Earth treatment was obscured/too abstract, the Pulse action control was weak, selected videos did not appear inline below the stream, the Pulse stream was limited to a small rotating window, the Discovery Radar sweep was offset, and Trending Topics/Creator Spotlight looked too static.

### Cause
Confirmed in app/living/page.tsx:
- Earth used separate CSS land spans rather than one coherent globe surface.
- The Pulse header button selector targeted a direct child of .pulseSectionHead, but the button is nested inside .pulseHeadActions.
- Pulse cards were rendered as a six-card grid window.
- Radar sweep positioning did not center the sweep and ring as one unit.
- Topic sparks used a fixed five-segment treatment and Spotlight only exposed three visible creators.

### Fix
Replaced the leaf-like Earth spans with a clipped SVG globe; added source-coverage and refresh information; expanded Pulse into a horizontally scrolling verified-pool stream with auto-scroll and loop-back; added a visible View all signals control; added inline selected-video playback with full title and source metrics; mapped known YouTube category IDs before keyword fallback; centered the Radar; made topic graphs momentum-driven and animated; and made Creator Spotlight scrollable.

### Prevention
Living Field QA must verify globe visibility, visible Pulse controls, inline selected playback, continuous rightward movement, centered Radar sweep, animated momentum graph, and access to more verified creators. Run npm run verify before deployment.

### Related
app/living/page.tsx
docs/RALLIVIO_STATE.md
docs/SESSION_LOG.md



## KI-008 — Discover build fails on nonexistent Simple Icons LinkedIn export
First seen: 2026-09-19 · Status: Resolved · Ladder level: 3 → target 4
Severity: HIGH

### Symptom
Vercel deployment `dpl_Da58Jp98hndj4V2QbeXvsyxaYZAW` failed during the production build with:
`Type error: '"simple-icons"' has no exported member named 'siLinkedin'. Did you mean 'siLinkerd'?`

The build log also showed:
`Attempted import error: 'siLinkedin' is not exported from 'simple-icons'`.

### Cause
`app/page.tsx` imported `siLinkedin` from `simple-icons`, but the installed `simple-icons@16.31.0` package does not export that symbol. The repository's existing `scripts/check-platform-icons.mjs` already treated LinkedIn as a local exception, so the page import had drifted away from the established icon contract.

### Fix
Removed the invalid `siLinkedin` import and restored the existing LinkedIn local-exception path in `app/page.tsx`, preserving the existing brand color and exact validated path. Strengthened `scripts/check-platform-icons.mjs` to fail the prebuild if `siLinkedin` is reintroduced into `app/page.tsx`.

### Prevention
Keep platform icon validation as a prebuild gate and explicitly enforce the LinkedIn local exception. This is a deterministic, automatically detected known failure; target Level 4 by centralizing the exception contract if additional platform icon integrations are added.

### Related
`app/page.tsx`
`scripts/check-platform-icons.mjs`
`docs/RESILIENCE_SYSTEM.md`
`docs/SESSION_LOG.md`


## KI-009 — DiscoverGlobe timer fallback narrows to never in TypeScript
First seen: 2026-09-19 · Status: Resolved · Ladder level: 3 → target 4
Severity: HIGH

### Symptom
GitHub Actions run #412 reached verification but failed during typecheck with:
`components/DiscoverGlobe.tsx(226,16): error TS2339: Property 'setTimeout' does not exist on type 'never'.`

### Cause
The DiscoverGlobe scheduling expression used an `"requestIdleCallback" in window` conditional. Under the project's TypeScript DOM typings, the property was known to exist, so the fallback branch was narrowed to `never`, making `window.setTimeout` invalid there.

### Fix
Changed feature detection to `typeof window.requestIdleCallback === "function"` and used `globalThis.setTimeout` for the fallback. Cleanup now uses the corresponding `typeof window.cancelIdleCallback === "function"` check and `globalThis.clearTimeout` fallback.

### Prevention
Use runtime function checks for browser API feature detection when TypeScript can statically know the property exists. Keep `npm run verify` as the regression gate.

### Related
`components/DiscoverGlobe.tsx`
`docs/SESSION_LOG.md`


## KI-010 — JSX syntax error reached the production build
First seen: 2026-09-19 · Status: Resolved · Ladder level: 1 → target 4
Severity: HIGH — blocks the deployment build

### Symptom
Vercel deployment `dpl_14bCnWKgzKtGGbJ6ZK5Wfrz1E9BP` failed during the build with:
`./app/living/page.tsx:391:1 Unexpected token. Did you mean {'>'} or &gt;?`
The offending line was `391 | /span>`.

### Cause
An orphaned `/span>` remained after `<DiscoverGlobe />` was inserted. The line had no matching opening element and was a parse-time JSX syntax error caught by SWC.

### Fix
Delete line 391 entirely. The correction already exists in commit `8578ca555e97707f5ff01ea0b0ba36d6b08fb453`, titled `Fix DiscoverGlobe JSX wrapper after live route integration`.

### Prevention
Level-4 target: a pre-push hook runs `npm run build` so a file that does not parse is rejected before push. The repository must ensure the hook is installed/enabled for developers.

### Related
`app/living/page.tsx`
`docs/RUNBOOK.md` → Build fails on Vercel but no log access
`docs/RESILIENCE_SYSTEM.md`

## KI-011 — Vercel build-log connector unavailable
First seen: 2026-09-18 · Status: Open · Ladder level: 2
Severity: MEDIUM

### Symptom
The Vercel build-log retrieval capability returns:
`INVALID_ARGUMENT — Tool get_deployment_build_logs not found`
Deployment metadata calls succeed; build-log retrieval is unavailable.

### Cause
Partial connector outage: the build-log capability is absent from the current connector/tool registry. This is distinct from a complete Vercel project disconnect.

### Fix
No connector-side fix is available from the repository. Use the local production build first, then Vercel dashboard/connector logs when available, then GitHub Actions logs. Request reconnection only when all equivalent evidence paths are unavailable.

### Prevention
Local production build is now the first build-evidence source, so this connector outage does not by itself block diagnosis.

### Related
`docs/RESILIENCE_SYSTEM.md`
`docs/RUNBOOK.md` → Build fails on Vercel but no log access


## KI-012 — Vercel Hobby cron validation rejects sub-daily schedules
First seen: 2026-09-19 · Status: Resolved · Ladder level: 2 → target 4
Severity: HIGH — blocks deployment creation

### Symptom
A verified feature commit received a failed Vercel status but no normal deployment record. The Vercel status target redirected to Vercel Cron Jobs Usage & Pricing documentation.

### Cause
Confirmed: the Hobby deployment rejected sub-daily cron expressions during Vercel validation before the normal deployment/build path. The repository declared acquire every 6 hours, refresh hourly, and signals hourly.

### Fix
Changed vercel.json to once-daily schedules: acquire 0 2 * * *, refresh 0 8 * * *, signals 30 8 * * *. Commit a751048c8d99e1558925aabb6e3ece80a70f85ca. No application logic changed. The corrected commit received a real Vercel deployment target and entered pending state.

### Prevention
Before diagnosing a missing deployment, inspect the exact commit's Vercel status target and follow it. Then inspect vercel.json and compare cron frequency with the active hosting plan. Target Level 4: add a repository verification guard for the declared deployment plan/profile so incompatible cron schedules fail before push.

### Recovery rule
Do not create repeated trigger commits. Classify the failure first, make the smallest deterministic configuration fix, then verify deployment creation → READY → exact deployed SHA → served route.

### Caveat
Daily Hobby schedules restore deployability but reduce refresh frequency. Hourly “Now Moving” semantics require a scheduler/hosting capability that supports hourly or sub-daily execution.

### Related
vercel.json
docs/RESILIENCE_SYSTEM.md
docs/SESSION_LOG.md


## KI-013 — Preview discovery worker had no recurring scheduler
First seen: 2026-09-19 · Status: Resolved · Ladder level: 3 → target 4
Severity: HIGH

### Symptom
The feature Preview served persisted discovery data, but the dashboard remained at the old 25-video seed and reported no recent acquisition activity. The Preview showed stale observations rather than a broad current discovery pool.

### Cause
Confirmed:
- Vercel Cron invokes the production deployment, not a Preview deployment.
- The Hobby plan only supports once-daily Vercel Cron execution.
- The feature Preview therefore had no recurring worker scheduler.
- `app/api/discovery/route.ts` also contained a transitional request-time YouTube `search.list` acquisition path, so the architecture had two competing acquisition paths.

### Fix
- Made `app/api/discovery/route.ts` read-only against the persisted Supabase pool.
- Expanded the background acquisition worker to use YouTube `videos.list?chart=mostPopular` across 10 regions and 15 broad categories, with channel statistics enrichment.
- Added a secure Preview scheduler using Supabase Cron + pg_net and a Vault-backed scheduler token. It runs acquisition every 6 hours, refresh hourly, and signal calculation 15 minutes after refresh.
- Kept the existing `CRON_SECRET` path for Vercel/authorized operational calls.

### Prevention
Keep acquisition/refresh/signals out of request-time serving. Monitor `api_usage`, `video_stats_snapshots`, and Supabase Cron job history. Target Level 4 by adding an automated health check that alerts when acquisition falls behind its expected cadence.

### Related
`lib/server/youtube-discovery.ts`
`app/api/discovery/route.ts`
`supabase/migrations/20260919043000_add_rallivio_preview_scheduler.sql`
`docs/SESSION_LOG.md`
