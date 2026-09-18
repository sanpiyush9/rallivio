# RALLIVIO — Troubleshooting Runbook

## Build fails on Vercel but no log access

1. Reproduce locally — do this before anything else:
   ```bash
   git checkout <failing-sha>
   rm -rf .next node_modules && npm ci
   npm run build 2>&1 | tee build.log
   ```
2. Read the FIRST error block, not the last. Later errors can cascade from the first failure.
3. Identify the class from the message:
   - "Unexpected token" / "Syntax Error" → parse error; check the named line
   - "Type error:" → TypeScript; confirm with `npx tsc --noEmit`
   - "Module not found" → missing dependency or bad import path
   - an ESLint rule name → lint failure
4. Note that Vercel's `errorCode` is a classification, not the underlying error. `lint_or_type_error` can also appear for syntax errors.
5. Fix, rebuild locally, and only then push.
6. If local reproduction is unavailable, use Vercel build logs from the dashboard/connector.
7. If Vercel logs are unavailable, use GitHub Actions workflow logs.
8. Only if all equivalent evidence sources are unavailable should diagnosis stop and reconnection be requested.

### Incident example — 2026-09-19

Deployment `dpl_14bCnWKgzKtGGbJ6ZK5Wfrz1E9BP` reported `lint_or_type_error` with `npm run build` exiting with code 1. The actual first error was a JSX parse error at `app/living/page.tsx:391`: an orphaned `/span>` line. Commit `8578ca555e97707f5ff01ea0b0ba36d6b08fb453` removed the line. This demonstrates why the first error block, rather than Vercel's summary classification, is the diagnostic source of truth.

### Related

- KI-010 — JSX syntax error reached the production build
- KI-011 — Vercel build-log connector unavailable
- `docs/RESILIENCE_SYSTEM.md`
