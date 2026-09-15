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
- Added infrastructure tests that deliberately exercise each failure mode and verify the required messages.
- Added the required context report to `docs/AI_START_HERE.md`.
- Registered `KNOWN_ISSUES.md` and `SESSION_LOG.md` as CURRENT in `docs/CANONICAL.md`.
- Verified the final documentation-enforcement checks and the full verification chain.

### Not done
- No area-specific `known-issues/*.md` split was needed; the register is below the suggested 30-entry threshold.

### Next session should
Open the Vercel Preview deployment for `feature/docs-enforcement` and verify the deployment settings no longer expect a `dist` output directory before UI QA.

### Gotchas discovered
- Vercel can finish the Next.js build and still fail afterward if its Output Directory is configured as `dist`.
- Next.js may report an ESLint configuration error during build while continuing into page generation; standalone CI linting is therefore essential.

### Documents touched
- Added `docs/KNOWN_ISSUES.md` and `docs/SESSION_LOG.md`.
- Updated `docs/AI_START_HERE.md` with the required context report.
- Updated `docs/CANONICAL.md` to list both new documents as CURRENT.
- No product specification was changed.
