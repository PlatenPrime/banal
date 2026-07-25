# Incident rollback

Minimal revert steps for production/staging incidents. API deploy runbook: [deploy/railway.md](../deploy/railway.md). Web deploy runbook: [deploy/vercel.md](../deploy/vercel.md).

## Principles

1. Prefer **redeploy previous known-good revision** over hotfixes under pressure.
2. Confirm health after rollback (`/health`, `/health/ready` on API; web home load).
3. Record what shipped, what was reverted, and follow-up in the incident note.

## Railway (API)

1. Open the API service → **Deployments**.
2. Select the last known-good deployment → **Redeploy** / rollback to that revision.
3. Verify env vars unchanged (JWT secrets, `MONGODB_URI`, `TRUST_PROXY`, CORS origins).
4. Smoke: `GET /health` and `GET /health/ready` (or `API_BASE_URL=… node scripts/smoke-api.mjs`).

If rollback is unavailable, pin the service to the previous git commit/image and redeploy from that ref.

**Dry-run (staging):** Confirmed 2026-07-23 during T21 — staging Deployments lists prior revisions with Redeploy available after successful deploys. Full practice redeploy optional; see [track-21-railway-api-deploy-freeze.md](../track-21-railway-api-deploy-freeze.md).

## Vercel (Web)

Projects: `banal-web-staging`, `banal-web-production`. Full runbook: [deploy/vercel.md](../deploy/vercel.md).

1. Open the project → **Deployments**.
2. Promote / redeploy the last known-good **Production** deployment (**Instant Rollback** in the dashboard, or CLI `vercel rollback` / `vercel promote <deployment-url|id>` against the linked project).
3. Confirm `VITE_API_URL` public env only; no secrets in the client bundle. After rollback, the redeployed revision keeps the env it was built with — if you changed `VITE_API_URL` later, redeploy from `main` instead of rolling back a stale build.
4. Smoke: `WEB_BASE_URL=<web-origin> node scripts/smoke-web.mjs` (home + `/login` SSR 200).

**Dry-run (staging):** Confirmed 2026-07-25 during T22 — staging Deployments lists prior Production revisions after the first successful deploy. Practice Instant Rollback / promote previous on **staging only** → re-run `scripts/smoke-web.mjs`. Recorded in [track-22-vercel-web-deploy-freeze.md](../track-22-vercel-web-deploy-freeze.md).

## Shared / data

- **Do not** point CI or local compose at production Atlas URI.
- DB schema/data rollbacks are out of scope for this stub; auth/user collections follow ADRs once present.
- Cookie/session issues after API rollback: users may need to re-login (JWT secret rotation invalidates sessions — see [secrets-checklist.md](secrets-checklist.md)#jwt-secret-rotation).

## Related

- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T21 Railway, T22 Vercel, T25 runbooks
- [environments.md](environments.md) — env matrix
- [secrets-checklist.md](secrets-checklist.md) — secret placement + rotation
- [branch-protection.md](../branch-protection.md) — required checks before merge
- [SECURITY.md](../../SECURITY.md) — vulnerability reporting
