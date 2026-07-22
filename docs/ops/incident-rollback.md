# Incident rollback (stub)

Minimal revert steps for production/staging incidents. Full deploy runbooks land in Tracks **T21–T25** (`docs/deploy/` — not yet created).

## Principles

1. Prefer **redeploy previous known-good revision** over hotfixes under pressure.
2. Confirm health after rollback (`/health`, `/health/ready` on API; web home load).
3. Record what shipped, what was reverted, and follow-up in the incident note.

## Railway (API)

When Railway is configured (T21):

1. Open the API service → **Deployments**.
2. Select the last known-good deployment → **Redeploy** / rollback to that revision.
3. Verify env vars unchanged (JWT secrets, `MONGODB_URI`, `TRUST_PROXY`, CORS origins).
4. Smoke: `GET /health` and `GET /health/ready` on the staging/prod API URL.

If rollback is unavailable, pin the service to the previous git commit/image and redeploy from that ref.

## Vercel (Web)

When Vercel is configured (T22):

1. Open the project → **Deployments**.
2. Promote / redeploy the last known-good production deployment (Instant Rollback if enabled).
3. Confirm `VITE_*` public env only; no secrets in the client bundle.
4. Smoke: load the web origin; hit a simple authenticated or public page as appropriate.

## Shared / data

- **Do not** point CI or local compose at production Atlas URI.
- DB schema/data rollbacks are out of scope for this stub; auth/user collections follow ADRs once present.
- Cookie/session issues after API rollback: users may need to re-login (JWT secret rotation invalidates sessions — see secrets runbook in T12).

## Related

- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T21 Railway, T22 Vercel, T25 runbooks
- [branch-protection.md](../branch-protection.md) — required checks before merge
- [SECURITY.md](../../SECURITY.md) — vulnerability reporting
