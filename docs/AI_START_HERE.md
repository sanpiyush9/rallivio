# START HERE

**Read this file first. Every session. No exceptions.**

---

## What RALLIVIO is

A discovery platform for the creator economy. We surface what is genuinely trending across social platforms — starting with YouTube — and connect creators with brands. We send traffic *to* the platforms; we do not compete with them or host their content.

Our differentiator is fair discovery: newcomers surfaced on merit, measured against creators their own size, rather than by absolute reach.

---

## Current phase

> **Update this section whenever the phase changes.**
> The current phase is authoritative only when it agrees with `docs/RALLIVIO_STATE.md` and `docs/CANONICAL.md`.

**Phase 0 — transitioning from static prototype to the first real-data vertical slice.**

The immediate implementation proves this narrow loop first:

`YouTube source → acquisition → normalized data → RALLIVIO signal/ranking → Discover UI → YouTube playback`

The broader product vision includes Trending, Rising/Breaking Out/Under the Radar signals, creator intelligence, creator↔brand opportunities, and additional platforms, but those are not permission to build everything at once.

If a task changes scope, product behavior, architecture, ranking rules, or a hard requirement, update the living state and record the transition before implementing it.

---

## The project memory contract — critical

**The AI must never use chat memory, assumptions, or old code as the source of truth when the documented project state can answer the question.**

`docs/CANONICAL.md` → `docs/RALLIVIO_STATE.md` → relevant current spec/design → recent `docs/SESSION_LOG.md` → `docs/KNOWN_ISSUES.md` is the project's memory chain.

The goal is that a new AI session can continue the project without the owner re-explaining what happened in previous sessions.

### Before every change

1. Read `docs/CANONICAL.md`.
2. Read `docs/RALLIVIO_STATE.md`.
3. Read the current spec/design documents for the area being changed.
4. Read the most recent 3 entries in `docs/SESSION_LOG.md`.
5. Search `docs/KNOWN_ISSUES.md` for the symptom, subsystem, and relevant keywords **before debugging**.
6. Inspect the current branch, working tree/diff, and actual implementation before deciding what to change.
7. State the current state, applicable requirements, intended change, files affected, and any ambiguity before coding.

### After every meaningful change

The AI is responsible for keeping project memory synchronized. Do not wait for the owner to ask.

- **Requirement/scope/product behavior changed:** update `docs/RALLIVIO_STATE.md` with date, old requirement, new requirement, reason, impact, and implementation status. If a canonical spec changes, update `docs/CANONICAL.md` in the same change.
- **Architecture/design decision changed:** record the decision and its reason in the project's decision record when that record is available; never silently replace an architectural choice.
- **Code/implementation changed:** update `docs/SESSION_LOG.md` with what changed, what remains, exact next action, gotchas, and documents touched.
- **Bug/failure fixed:** update `docs/KNOWN_ISSUES.md`, add/adjust the regression test where practical, and assign the resilience ladder level.
- **New requirement conflicts with an old requirement:** stop and explicitly reconcile it. Never silently choose one.
- **Work is deferred:** record exactly what was deferred and why; do not let unfinished work disappear from project memory.

### Requirement transition protocol

Requirements are expected to evolve as the product is tested. Evolution is allowed; silent mutation is not.

Every transition follows this record:

`Current requirement → New requirement → Why it changed → Impact → Implementation status → Validation/QA → Date`

The living state keeps the history. Current canonical specifications define what is active. Superseded documents remain historical and are never silently deleted.

### No random changes

Before changing code, the AI must be able to answer:

- What requirement am I implementing?
- Which current document authorizes it?
- What existing behavior could this affect?
- Is there a known issue or previous decision related to it?
- What is the smallest isolated change that solves the task?
- How will I verify that unrelated behavior was not broken?

If those answers cannot be established from the repository/documentation, inspect further or ask. Do not guess.

---

## Before writing any code

1. Read `docs/CANONICAL.md` — it names which documents are current
2. Read `docs/RALLIVIO_STATE.md` — it records the living requirements and current implementation state
3. Read the documents CANONICAL lists for the area you are working on
4. Read the last 3 entries in `docs/SESSION_LOG.md`
5. Read `docs/KNOWN_ISSUES.md` and check for anything touching your area
6. Confirm which branch you are on
7. Inspect the current implementation and diff

Then state what you understand the current state to be, which documents you are treating as authoritative and their versions, and what you expect to modify — **before** writing code.

## Required context report

Before writing any code, output this report. If you cannot fill in a row, you have not read that document — read it before continuing.

| Document | Version | Key thing I took from it |
|---|---|---|
| CANONICAL.md | | |
| RALLIVIO_STATE.md | | |
| [spec for this area] | | |
| SESSION_LOG.md (last 3) | | |
| KNOWN_ISSUES.md | | Any entries touching this area? |

Then state:
- What I understand the current state to be
- What I think this task requires
- Which files I expect to modify
- What previous decisions constrain the implementation
- Anything in the spec that seems ambiguous or wrong

Wait for confirmation before writing code **when the task changes product requirements, scope, architecture, or a canonical specification**. For ordinary implementation/fix work that is already authorized by the current documents, proceed without unnecessary blocking, while still producing the context report internally and documenting the result.

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
- `docs/RALLIVIO_STATE.md` is the living requirements/status ledger and must be kept synchronized with meaningful product changes.
- If you find a document that seems relevant but is not listed, ask. Do not use it.
- If you believe a listed document is wrong, say so in chat. Do not silently pick another.
- Never modify `DECISIONS.md` — propose, the owner decides.
- Never modify `CANONICAL.md` except as part of a spec change or explicit canonical-registration task.

**Quality**
- Run `npm run verify` before proposing a PR. If it is red, nothing merges.
- Every bug fix produces three things: a test that would have caught it, a `KNOWN_ISSUES.md` entry, and a ladder decision (see `docs/RESILIENCE_SYSTEM.md`).

**Honesty**
- Never invent data, statistics, brand names, or logos in shipped code.
- Never display a claim outside Tier 1 or Tier 2 of the claims policy (Part 10 of the master document).
- Never fabricate content to fill an empty state. Degrade honestly and label the degradation.

**Ending a session**

Before stopping work, synchronize project memory:
1. Update `docs/RALLIVIO_STATE.md` if requirements, scope, architecture, implementation status, or important constraints changed.
2. Append an entry to `docs/SESSION_LOG.md` using the template at the top of that file.
3. Update `docs/KNOWN_ISSUES.md` for bugs/failures according to the resilience ladder.
4. Run `npm run verify` before proposing a PR when implementation changed.
5. Ensure the latest session entry has a precise **Next session should** action naming a file or first command.
6. Leave no undocumented decision, deferred task, discovered gotcha, or requirement transition behind.

---

## Where things live

| Concern | Location |
|---|---|
| Which document is current | `docs/CANONICAL.md` |
| Living requirements and project state | `docs/RALLIVIO_STATE.md` |
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
