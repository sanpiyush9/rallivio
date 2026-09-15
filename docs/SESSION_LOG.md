# SESSION LOG

> Newest entries at the top.
> Read the most recent 3 before starting work.

## Template — copy this for every new entry

```markdown
## YYYY-MM-DD — Short title
Branch: feature/xxx
Status: Complete | In progress | Blocked

### Done
- What was actually finished and merged

### Not done
- What was started but left incomplete
- What was deliberately deferred and why

### Next session should
[MANDATORY — name a specific file and line, or a specific first action.
"Continue the feature" is not acceptable. This is the single highest-value
line in the entire documentation system.]

### Gotchas discovered
- Anything surprising that a future session would waste time rediscovering

### Documents touched
- Which specs or design assets changed, and whether CANONICAL.md was updated
```

---

## 2026-09-15 — Phase 0 real-data foundation
Branch: feature/phase0-data-foundation
Status: In progress

### Done
- Added canonical Phase 0 data-model, signal-engine, and weekly-leaderboard specifications.
- Registered the three specs in `docs/CANONICAL.md`.
- Added the Phase 0 Supabase foundation for channel observations, discovery signals, weekly rankings, click attribution, system health, relaxation logs, and atomic YouTube quota usage.
- Applied the foundation migration to the connected `rallivio` Supabase project; the discovery tables are currently empty, so no existing creator/video rows were changed.
- Added a server-side YouTube adapter, daily quota guard, scheduled acquisition worker, audience-relative signal computation, and database-backed leaderboard serving.
- Replaced the static Discover page with a database-backed Phase 0 leaderboard that refuses to fabricate creators when history is insufficient.
- Added outbound YouTube click attribution and deterministic tests for quota limits, shrinkage, and freshness.
- Added a daily Vercel Cron entry. The cron is protected by `CRON_SECRET` and the worker requires `YOUTUBE_API_KEY` plus `SUPABASE_SERVICE_ROLE_KEY` at runtime.
- Recorded the provider-ID and insufficient-history fixes in `docs/KNOWN_ISSUES.md`.

### Not done
- The connected Supabase project has zero discovery rows and zero video snapshots, so the live leaderboard cannot contain real creators until a successful YouTube acquisition run occurs.
- Vercel environment variables `YOUTUBE_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `CRON_SECRET` still need to exist in the deployment environment. These are secrets and are not committed to the repository.
- The full `npm run verify` result for this branch has not yet been observed in GitHub Actions.
- The branch still needs the first live deployment and end-to-end acquisition check before it can be proposed for staging.

### Next session should
Run the GitHub Actions `verify` check for `feature/phase0-data-foundation`; if it fails, fix the first failing typecheck/lint/test/build error before changing the data architecture.

### Gotchas discovered
- The connected Supabase project already contained the discovery foundation tables from earlier migrations but the tables were empty; the new migration therefore adds missing Phase 0 tables and policies without fabricating seed data.
- The official YouTube API currently documents `search.list` as a separately budgeted method; this project still follows the canonical Phase 0 budget of at most 60 search calls/day and 10,000 total units.
- Vercel Cron runs on the production deployment, so feature-branch previews are useful for UI verification but do not by themselves prove the scheduled worker has executed.
- The public Supabase key is safe to expose to the browser, but the service-role key and YouTube key must remain server-side.

### Documents touched
- Added `docs/specs/data-model-v1.md`, `docs/specs/signals-v1.md`, and `docs/specs/leaderboard-v1.md` and updated `docs/CANONICAL.md`.
- Added `supabase/migrations/20260915150000_phase0_data_foundation.sql` and `supabase/migrations/20260915151000_youtube_quota_usage.sql`.
- Updated `docs/KNOWN_ISSUES.md` and this session log.
- No changes were made to the product strategy outside the Phase 0 data implementation.

---

## 2026-09-15 — Vercel deployment self-healing
Branch: feature/docs-enforcement
Status: In progress

### Done
- Investigated the failed Vercel deployment instead of asking for a screenshot first.
- Confirmed the known failure mode: Vercel was expecting `dist` while the Next.js app builds to `.next`.
- Added repository-level `vercel.json` with `framework: nextjs` and `.next` output directory so the repository carries the correct deployment configuration.
- Updated KI-001 from Level 1/Open to Level 3/Resolved because the repository now auto-recovers the known output-directory mismatch.

### Not done
- The new repository configuration has not yet been validated by a fresh Vercel deployment.
- The Vercel connector in that session could not access the user's personal Vercel scope.

### Next session should
Check the newest `feature/docs-enforcement` Vercel deployment status; if it is still failing, inspect its build log for the first new error rather than reverting `vercel.json`.

### Gotchas discovered
- The Vercel connector returned 403 for the guessed team scope and `list_teams` returned no teams, so the project appears to be outside the connector's accessible team scope.
- Vercel documentation confirms `outputDirectory` can be overridden in repository-level `vercel.json`.

### Documents touched
- Added `vercel.json`.
- Updated `docs/KNOWN_ISSUES.md` and this session log.
- No product specification changed.

---

## 2026-09-15 — Documentation enforcement system
Branch: feature/docs-enforcement
Status: Complete

### Done
- Added `docs/KNOWN_ISSUES.md` with the searchable index, maturity report, template, and KI-001/KI-002 entries.
- Added `scripts/check-docs.js` with four documentation-enforcement checks and wired it into `npm run verify`.
- Added infrastructure tests that deliberately exercise each failure mode and print the observed failure output.
- Added the required context report to `docs/AI_START_HERE.md`.
- Registered `KNOWN_ISSUES.md` and `SESSION_LOG.md` as CURRENT in `docs/CANONICAL.md`.
- Restored the CURRENT resilience and kickoff documents required by the canonical verification, plus an honest superseded roadmap marker.
- Fixed the Next.js flat ESLint configuration so standalone linting and the build both enforce lint successfully.
- `npm run verify` passed in GitHub Actions on the final implementation state.

### Not done
- The Vercel project still needs its Output Directory setting corrected from `dist` to the normal Next.js deployment behavior; this is a dashboard configuration task, not a repository build failure.
- No area-specific `known-issues/*.md` split was needed; the register is below the suggested 30-entry threshold.

### Next session should
Open the Vercel Preview deployment for `feature/docs-enforcement`, remove the `dist` Output Directory override in Project Settings, redeploy, and then run the first live UI QA pass.

### Gotchas discovered
- Vercel can finish the Next.js build and prerendering successfully and still fail afterward if its Output Directory is configured as `dist`.
- Next.js 15.5.24 with the installed `eslint-config-next` package did not expose the flat configs in the iterable shape expected by the initial config; `FlatCompat` is now used explicitly.
- The documentation diff check needs full Git history, so the verification workflow uses `fetch-depth: 0` to make `origin/main...HEAD` available.

### Documents touched
- Added `docs/KNOWN_ISSUES.md` and `docs/SESSION_LOG.md`.
- Updated `docs/AI_START_HERE.md` with the required context report.
- Updated `docs/CANONICAL.md` to list both new documents as CURRENT.
- Restored `docs/RESILIENCE_SYSTEM.md` and `docs/KICKOFF_INSTRUCTIONS.md` required by the canonical index.
- Retained `docs/RALLIVIO_RESTART_ROADMAP.md` as an explicit superseded marker.
- No product specification was intentionally changed.
