# RALLIVIO — Kickoff Instructions

How to start building with ChatGPT, session by session. Follow in order.

## Before session 1

### Repository and branches

Create the repository, then keep `main` and `staging` protected. AI work happens only on `feature/*` branches.

Required branch flow:

```text
feature/* → PR → staging → verify → PR → main
```

### Branch protection

For both `main` and `staging` require pull requests and passing status checks; do not allow force pushes or deletions. The protection is structural, not a prompt-level instruction.

### Documentation set

The canonical documentation set includes:

- `docs/CANONICAL.md`
- `docs/AI_START_HERE.md`
- `docs/RALLIVIO_MASTER_v2.md`
- `docs/RESILIENCE_SYSTEM.md`
- `docs/SESSION_LOG.md`
- `docs/KNOWN_ISSUES.md`
- `docs/RUNBOOK.md`

### Vercel and Supabase

Use separate staging and production environments. Vercel production tracks `main`; preview deployments are used for feature QA.

## Session 1 — Verification pipeline

**Branch:** `feature/verify-pipeline`

The verification pipeline must run, in order:

1. `tsc --noEmit`
2. `eslint`
3. `vitest run`
4. `next build`
5. `node scripts/check-canonical.js`

The repository also has documentation enforcement through `node scripts/check-docs.js` in the verify chain.

The canonical check must fail if a CURRENT file is missing, a SUPERSEDED file lacks its warning banner, or a Markdown spec under `docs/specs/` is absent from `CANONICAL.md`.

## Session discipline

Before writing code:

1. Read `docs/AI_START_HERE.md`.
2. Read `docs/CANONICAL.md`.
3. Read the current documents for the area.
4. Read the last three `docs/SESSION_LOG.md` entries.
5. Search `docs/KNOWN_ISSUES.md` before debugging.
6. Confirm the branch.
7. Produce the required context report and wait for confirmation before writing code.

At the end of every session, append to `docs/SESSION_LOG.md` and provide a specific `Next session should` action naming a file and line or a first concrete action.

## Product constraints

- Never scrape creator data; creator data comes from consent via OAuth.
- Never call YouTube `search.list` at request time; acquisition is scheduled and quota-budgeted.
- Request-time serving reads our own database.
- Do not store video content; store metadata and time-series statistics.
- Derived metrics must be labeled as RALLIVIO metrics, not YouTube metrics.
- Never invent data or fill empty states with fabricated content.

## Recovery rule

If a session goes off track, do not merge it. Close the PR, create a fresh feature branch, reread the canonical documents, and restart with the session-start context report.

## Every session, without exception

**Start:** read the canonical entry point, issue register, and recent session log; state understanding before code.  
**End:** update `SESSION_LOG.md` with a concrete next action.  
**Between sessions:** preserve enough documented context that the next session does not need to rediscover prior decisions.
