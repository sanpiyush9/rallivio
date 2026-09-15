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
