# RALLIVIO Master Handoff — 2026-09-17

> Human-readable continuity record. GitHub code/commits are the implementation source of truth. Update this document whenever a material product, design, architecture, branch, QA, or deployment decision changes.

## 1. Product identity

RALLIVIO is a living creator-economy discovery ecosystem.

Core loop:

**Discover → Watch → Follow → Collaborate → Grow**

Do not turn RALLIVIO into a static dashboard, generic video directory, YouTube clone, popularity-only ranking system, fake-engagement system, paid organic-ranking system, or guaranteed-virality product.

## 2. Source-of-truth design references

- Approved Discover/Living design: `RALLIVIO_FULL_WEBPAGE_APPROVED_DESIGN_2026-09-13.png`.
- Creator design references supplied 2026-09-17:
  - Screenshot 1 = general/public Creator Page.
  - Screenshot 2 = subscribed Creator analytics/dashboard.
- Header direction under consideration/implementation:
  **Discover · Creators · Brands & Opportunities · Community · About · Search · Unlock Plans/RALLIVIO+ · Theme · Profile**.
- Creator UI should visually match the Discover/Landing RALLIVIO visual language.

## 3. Branch architecture — NON-NEGOTIABLE

### Discover/Living

`feature/living-position-editor`

- Discover/Living only.
- Do not mix Creator implementation into this branch.
- Preserve canonical 12-platform coordinates, square geometry, existing badge colors, and approved composition.

### Creator

`feature/creator-platform-subscription`

- Dedicated Creator workstream.
- Contains Creator Page, Free/Subscriber UX, platform switching, analytics, history, intelligence, opportunities, and subscription UI.
- Current Creator implementation originated from commit `5c7803ad396733d644302d72468d82db92336b92`.

### Production

`main`

- Never touch directly during QA.

## 4. Public / normal Creator Page

A creator remains one RALLIVIO entity. Do not create separate RALLIVIO identities for YouTube/Instagram/TikTok/etc.

Public experience should include:

- Creator identity: avatar, name, verification, handle, bio, niches/categories.
- Basic public statistics and public content.
- Follow / save / watch.
- Platform switch: All Platforms, YouTube, Instagram, TikTok, X, LinkedIn and future supported platforms.
- Platform-specific public content/basic information.
- Basic RALLIVIO discovery signals.
- Premium intelligence previews with locks.

The Free experience must be genuinely useful; do not lock the whole ecosystem.

## 5. RALLIVIO+ subscriber Creator dashboard

Subscription principle:

**Free users see the ecosystem. Subscribers unlock the intelligence behind it.**

Subscriber areas:

- Creator Overview
- Connected Accounts
- Platform Analytics
- Content Performance
- Audience Insights
- Cross-Platform Performance
- Historical Data
- RALLIVIO Intelligence
- Opportunities
- Collaboration
- Brand Matches
- Alerts & Notifications
- Advanced filters
- Export/reports
- Personalized recommendations

## 6. Platform switching

The Creator Page stays the same creator while the selected platform changes the content/analytics context.

Example tabs:

`All Platforms | YouTube | Instagram | TikTok | X | LinkedIn`

Each platform retains its native metrics. RALLIVIO adds a normalized cross-platform intelligence layer.

## 7. Historical data architecture

Do not rely only on a current API response. Maintain timestamped observations/snapshots.

### Creator history

- Followers/subscribers
- Views/reach
- Content count
- Other verified creator-level metrics

### Platform history

- Native platform metrics
- 7D / 30D / 90D / 1Y and longer history where available

### Content history

For every content item maintain, where legally/technically available:

- Platform/content ID
- Title
- Creator
- Platform
- Published timestamp
- First observed metrics
- Latest observed metrics
- Growth velocity
- Engagement changes
- RALLIVIO signal history

### Intelligence history

Maintain observable events such as:

- Momentum beginning
- Acceleration changes
- Topic emergence
- Breakout events
- Cross-platform movement/sequence

This allows RALLIVIO to answer not only **what is happening now**, but **what changed and when**.

## 8. Analytics trust model

Keep these layers distinct:

1. **Platform Data** — what the connected platform actually reports.
2. **RALLIVIO Intelligence** — calculations/derived signals from verified data.
3. **RALLIVIO Opportunities** — opportunities surfaced from observable signals.

Never fabricate metrics, engagement, audience information, platform activity, or verified claims.

## 9. Core RALLIVIO intelligence

Relevant signals and calculations include:

- Momentum score/change
- Acceleration / velocity
- Engagement quality
- Audience-relative performance
- Freshness
- Consistency/activity
- Cross-platform movement
- Now Moving
- Breaking Out
- On the Rise
- Under the Radar
- Just Dropped
- Live
- Why-this-is-moving explanations based on observable evidence

## 10. Free vs RALLIVIO+

| Capability | Free | RALLIVIO+ |
|---|---|---|
| Discover / Watch / Follow | Yes | Yes |
| Basic creator profile | Yes | Yes |
| Basic signals | Yes | Yes |
| Platform analytics | Basic/preview | Full |
| Historical analytics | Limited/locked | Full |
| Cross-platform intelligence | Preview | Full |
| RALLIVIO Intelligence | Preview/locked | Full |
| Advanced filters | Limited | Yes |
| Alerts | Limited | Yes |
| Opportunities/matching | Preview | Full |
| Export/reports | Limited/no | Yes |
| Personalized intelligence | Basic | Advanced |

Use visible locks/previews to communicate premium value without making Free useless.

## 11. Current Creator implementation state

`app/creators/page.tsx` was added on `feature/creator-platform-subscription` in commit `5c7803ad...`.

Initial implementation includes:

- Creator hero/profile area
- Unified-style Creator header
- Platform tabs
- 7D / 30D / 90D / 1Y controls
- Connected account presentation
- Growth overview metrics
- Platform performance
- Audience insights
- Top-performing content
- RALLIVIO Intelligence
- Opportunities
- Content history
- Recent activity
- Upcoming opportunities
- RALLIVIO+ side panel
- Plan modal concept
- Free/Plus prototype state

Current numbers are prototype presentation data. Real platform APIs, authentication, billing, persistent historical storage, and production-grade analytics calculations are future integration layers.

## 12. Discover/Living icon work

Earlier Discover QA found incorrect hand-written SVG paths for Reddit, Spotify, Twitch, Snapchat, Pinterest, and Instagram. Diagnosis: the source was the hand-written `PlatformIcon()` switch, not CSS.

`simple-icons@16.31.0` was added with a prebuild validation guard. `siLinkedin` is absent in that version, so LinkedIn requires a documented local official-mark path exception and should be excluded from the Simple Icons export validation. Do not change canonical coordinates or badge colors while fixing icons.

This work belongs to Discover/Living, not Creator.

## 13. Deployment workflow — NON-NEGOTIABLE

A commit is **not** considered complete deployment.

Required sequence:

1. Make change on the correct QA branch.
2. Never touch `main`/production.
3. Trigger Vercel deployment.
4. Verify deployment uses the exact intended Git SHA.
5. Verify deployment state is `READY`.
6. Open/test the actual deployed URL.
7. Only then tell the user it is ready for QA and provide the live URL.
8. If deployment fails, self-heal/fix the deployment problem before declaring completion.
9. Never give an old deployment URL as proof that current work is live.

## 14. Vercel project / current blocker

Known project:

- Vercel project: `prj_FKsi7Jy0AtS7GAuAYEk3UbuIJBFU`

### Team ID discrepancy discovered 2026-09-17

Two different team IDs have appeared in prior working notes:

- `team_CivLA0IfaNod65bkBLLrKBeZ`
- `team_CivLA0IfaNod65bkBLLKBeZ`

These must be treated as **unverified** until the real Team ID is copied verbatim from Vercel Team Settings → General. Do not assume the capitalization/transposition is harmless; a wrong team ID can produce authorization/resource failures.

### Connector failure history

On 2026-09-17 the Vercel connector repeatedly returned a `403 Not Authorized` for the RALLIVIO team. The user authorized Vercel with access to all current/future projects, then disconnected/reconnected/refreshed.

A later connector attempt returned:

`Resource not found: Vercel.list_deployments. Call api_tool.list_resources again to rediscover the currently available tools.`

This second message is a ChatGPT connector/tool-registry error rather than evidence that the Vercel project itself is missing. Tool re-discovery/re-registration must be attempted before concluding that the original 403 remains.

### Deployment does not depend solely on the ChatGPT connector

The GitHub → Vercel integration can independently create a preview deployment when the QA branch is pushed. Therefore, when the connector is unavailable, the next self-healing path is:

1. Verify the exact Vercel Team ID in the dashboard.
2. Push `feature/creator-platform-subscription` to GitHub.
3. Watch Vercel project Deployments directly.
4. Verify branch, exact commit SHA, deployment state, and `/creators`.
5. If no deployment appears, inspect the GitHub commit's Vercel status/check.
6. Check whether the failure is a Vercel build quota/rate-limit issue before debugging integration permissions further.

### Hobby build-rate-limit checkpoint

A Hobby-plan build-rate-limit issue was reported earlier on 2026-09-17. If a new deployment is not created, check whether the Vercel/GitHub status or target URL contains an `upgradeToPro=build-rate-limit` indication. If present, treat quota as the active blocker rather than repeatedly reconnecting the connector.

### Known older READY deployment (not current Creator proof)

- Deployment: `dpl_5qbbBLH4CwxXcksyAECAe1LCHZHi`
- SHA: `567e1f0d91827e811872452cc6a5b54047eae554`

This deployment must never be presented as proof that the current Creator branch is live.

## 15. Vercel self-healing runbook

When deployment/access breaks, use this order instead of repeatedly reporting the same error:

### Phase A — Identity and scope

- Confirm the Vercel project ID.
- Confirm the Vercel Team ID directly from Vercel.
- Confirm the repository/project connection.
- Confirm the QA branch is `feature/creator-platform-subscription` for Creator work.

### Phase B — Connector recovery

- If the Vercel connector returns `403`, treat it as authorization/scope failure until verified.
- After reconnecting/authorizing, re-discover the Vercel tools.
- If the connector reports `Resource not found: Vercel.<function>`, treat that as connector registration state, not automatically as a Vercel project error.
- A fresh ChatGPT chat can be used to force clean connector registration.

### Phase C — Independent Git deployment test

- Push the correct QA branch to GitHub.
- Confirm whether Vercel automatically creates the preview.
- Check GitHub's Vercel status/check and the Vercel dashboard.
- Do not wait for connector access before testing GitHub → Vercel deployment.

### Phase D — Quota/build diagnosis

If no deployment appears:

- Check Vercel build quota/rate-limit status.
- Check GitHub/Vercel status text for `upgradeToPro=build-rate-limit`.
- If present, record quota as the blocker.
- Do not misdiagnose a quota failure as OAuth/integration failure.

### Phase E — Deployment acceptance

A deployment is accepted only when all are true:

- Correct QA branch
- Exact intended Git SHA
- Vercel deployment exists
- State = `READY`
- Actual deployment URL loads
- Target page `/creators` loads for Creator QA
- No old deployment URL is substituted for the current commit

### Current state

The above investigation has identified three concrete items to verify before further connector debugging:

1. The Team ID used in prior notes is inconsistent and must be verified verbatim.
2. The later `Vercel.list_deployments` error is a connector registry failure and should not be conflated with the original Vercel 403.
3. GitHub → Vercel automatic preview deployment should be tested independently, including the Hobby build-rate-limit possibility.

No claim is made here that the current Creator deployment is live; live status still requires exact-SHA + READY + URL verification.

## 16. Chat / transition protocol

If a conversation reaches its limit or work moves to a new ChatGPT chat:

1. Start by reading this file: `docs/RALLIVIO_MASTER_HANDOFF_2026-09-17.md`.
2. Inspect actual GitHub branch/commit state before making assumptions.
3. Confirm which workstream is being continued: Discover/Living or Creator.
4. Never mix branch responsibilities.
5. Review recent commits and current file state before editing.
6. Treat screenshots/design references as product/design inputs, not as permission to invent a different direction.
7. Preserve all non-negotiable QA/deployment rules.
8. Update this handoff when a material decision, branch, implementation, architecture, or deployment state changes.
9. For Vercel problems, read the self-healing runbook in Section 15 before reporting a blocker.

### New-chat starter

> Continue RALLIVIO from `docs/RALLIVIO_MASTER_HANDOFF_2026-09-17.md`. First inspect the actual GitHub state. Keep Discover/Living on `feature/living-position-editor` and Creator on `feature/creator-platform-subscription`; never touch main/production. Continue the exact recorded product/design direction. Creator = public Creator Page plus RALLIVIO+ subscriber dashboard with platform switching, native platform analytics, 7D/30D/90D/1Y history, content history, audience, cross-platform performance, RALLIVIO Intelligence, opportunities, alerts and subscription locking. Free gets useful discovery/basic public information; RALLIVIO+ unlocks deeper intelligence and tools. Header direction = Discover, Creators, Brands & Opportunities, Community, About, Search, Unlock Plans/RALLIVIO+, Theme, Profile. A deployment is complete only after Vercel READY + exact SHA verification + actual URL testing. If Vercel is inaccessible, diagnose the connector authorization/tool-registry state, verify the Team ID, and test GitHub → Vercel preview deployment independently before claiming deployment is unavailable.

## 17. Maintenance rule

This document is a continuity record, not a substitute for code. Every material change should be reflected here, while the actual implementation remains in GitHub commits. Before handing work to a new chat, update this document with the latest branch, commit, implementation state, open blockers, design decisions, and next action.

## 18. Self-healing issue log — 2026-09-17

**Issue:** RALLIVIO Vercel deployment access became unreliable while preparing Creator QA.

**Observed symptoms:**

- Initial Vercel connector response: `403 Forbidden — Not authorized ... You must re-authenticate to this scope or use a token with access to this scope.`
- User subsequently authorized/reconnected/refreshed Vercel.
- Later connector response: `Resource not found: Vercel.list_deployments. Call api_tool.list_resources again to rediscover the currently available tools.`

**Diagnosis:**

- The two errors must be tracked separately.
- The 403 is an actual authorization/scope failure from the Vercel side.
- The `Vercel.list_deployments` resource-not-found message is from the ChatGPT tool registry and does not prove that the Vercel project or deployment endpoint is missing.
- A team-ID mismatch is also possible because two different IDs exist in prior notes. This remains unresolved until verified against Vercel.
- A previously reported Hobby build-rate-limit is an independent possible deployment blocker and must be checked when automatic preview creation fails.

**Self-healing action path recorded:**

1. Verify Team ID directly in Vercel.
2. Re-register/re-discover Vercel tools after authorization, preferably from a fresh ChatGPT chat if necessary.
3. Independently push the Creator QA branch and test GitHub → Vercel preview creation.
4. Check quota/rate-limit status before repeatedly debugging OAuth.
5. Verify deployment branch + exact SHA + READY + `/creators` URL before QA handoff.

**Safety:**

- No main/production changes.
- Discover/Living remains isolated from Creator.
- No old preview URL may be used as current deployment proof.

**Resolution status:** `OPEN — diagnosis/runbook updated; live Vercel deployment still requires verification.`
