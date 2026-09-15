# START HERE

**Read this file first. Every session. No exceptions.**

---

## What RALLIVIO is

A discovery platform for the creator economy. We surface what is genuinely trending across social platforms — starting with YouTube — and connect creators with brands. We send traffic *to* the platforms; we do not compete with them or host their content.

Our differentiator is fair discovery: newcomers surfaced on merit, measured against creators their own size, rather than by absolute reach.

---

## Current phase

> **Update this section whenever the phase changes.**

**Phase 0 — Weekly emerging-creator leaderboard.**

We are building: a single public page ranking the fastest-rising creators in one niche and one region, updated weekly, with click attribution on every outbound link.

We are **not** building yet: filters, login, creator registration, brand features, marketplace, payments, or any platform beyond YouTube.

If a task does not serve Phase 0, it is out of scope. Say so rather than building it.

---

## Before writing any code

1. Read `docs/CANONICAL.md` — it names which documents are current
2. Read the documents CANONICAL lists for the area you are working on
3. Read the last 3 entries in `docs/SESSION_LOG.md`
4. Read `docs/KNOWN_ISSUES.md` and check for anything touching your area
5. Confirm which branch you are on

Then state what you understand the current state to be, which documents you are treating as authoritative and their versions, and what you expect to modify — **before** writing code.

## Required context report

Before writing any code, output this report. If you cannot fill in a row, you have not read that document — read it before continuing.

| Document | Version | Key thing I took from it |
|---|---|---|
| CANONICAL.md | | |
| [spec for this area] | | |
| SESSION_LOG.md (last 3) | | |
| KNOWN_ISSUES.md | | Any entries touching this area? |

Then state:
- What I understand the current state to be
- What I think this task requires
- Which files I expect to modify
- Anything in the spec that seems ambiguous or wrong

Wait for confirmation before writing code.

---

## Rules

**Branches**
- Never commit to `main` or `staging`. Ever.
- Work only on the `feature/*` branch specified for this session.
- One feature per branch.

**Scope**
- Do not modify files outside the feature you were assigned.
- If a change would touch more than 5 files, stop and describe the plan first.
- If a task seems to require changing a spec, say so — do not change it unilaterally.

**Documents**
- Build only from documents `CANONICAL.md` lists as CURRENT.
- If you find a document that seems relevant but is not listed, ask. Do not use it.
- If you believe a listed document is wrong, say so in chat. Do not silently pick another.
- Never modify `DECISIONS.md` — propose, the owner decides.
- Never modify `CANONICAL.md` except as part of a spec change you were explicitly asked to make.

**Quality**
- Run `npm run verify` before proposing a PR. If it is red, nothing merges.
- Every bug fix produces three things: a test that would have caught it, a `KNOWN_ISSUES.md` entry, and a ladder decision (see `docs/RESILIENCE_SYSTEM.md`).

**Honesty**
- Never invent data, statistics, brand names, or logos in shipped code.
- Never display a claim outside Tier 1 or Tier 2 of the claims policy (Part 10 of the master document).
- Never fabricate content to fill an empty state. Degrade honestly and label the degradation.

**Ending a session**
- Append an entry to `docs/SESSION_LOG.md` using the template at the top of that file.
- The "Next session should" line is mandatory and must name a specific file and line where work resumes.

---

## Where things live

| Concern | Location |
|---|---|
| Which document is current | `docs/CANONICAL.md` |
| Overall plan and strategy | `docs/RALLIVIO_MASTER_v2.md` |
| Failure handling, health checks | `docs/RESILIENCE_SYSTEM.md` |
| Why a decision was made | `docs/DECISIONS.md` |
| What happened last session | `docs/SESSION_LOG.md` |
| Known bugs and prevention | `docs/KNOWN_ISSUES.md` |
| Troubleshooting by symptom | `docs/RUNBOOK.md` |
| Colors, type, spacing, motion | `docs/DESIGN_SYSTEM.md` |
| Routes (thin) | `app/` |
| All business logic | `features/` |
| Shared utilities, no logic | `lib/` |
| Theme tokens | `styles/tokens.css` |

---

## Hard constraints that never change

**YouTube API**
- `search.list` costs 100 units. Default quota is 10,000/day — about 100 searches total per day.
- Never call `search.list` at request time. Scheduled worker only, within budget.
- `videos.list` costs 1 unit per 50 videos. Use it for stat refresh.
- Request-time serving reads only from our own database.
- Never substitute our own number for a YouTube number. Likes must be YouTube's like count.
- Our derived metrics must be labeled as ours ("RALLIVIO Momentum Score"), never as YouTube's.

**Data**
- Creator data comes from creator consent via OAuth. Never scraping.
- We do not host or store video content. We store metadata and time-series statistics.

**The truth rule**
- When an exact signal is unavailable, broaden signal strength — never the user's intent.
- Topic, format and language are hard constraints. Region and signal strength may relax.
- Every relaxation is recorded and displayed.

**If you are stuck:** say so. Ask rather than guess when two documents conflict, a spec is silent, a task is out of scope, or compliance is uncertain.
