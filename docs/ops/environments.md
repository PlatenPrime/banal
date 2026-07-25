# Environments matrix

Canonical definition of **local**, **preview**, **staging**, and **production** for the banal platform (Track 12). Deploy runbooks: [deploy/README.md](../deploy/README.md), [deploy/railway.md](../deploy/railway.md), [deploy/vercel.md](../deploy/vercel.md), [deploy/cookie-cutover.md](../deploy/cookie-cutover.md). Secrets placement: [secrets-checklist.md](secrets-checklist.md). Local runbook: [LOCAL_SETUP.md](../LOCAL_SETUP.md). Shared Mongo policy: [ADR-001](../adr/001-shared-mongodb-with-legacy.md).

## Matrix

| Env            | API                     | Web                                                        | Mongo DB name                   | Notes                                                                                                                  |
| -------------- | ----------------------- | ---------------------------------------------------------- | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| **local**      | `localhost:4000` (Nest) | `localhost:3000` (Vite)                                    | `app_foundation_dev`            | Docker Compose Mongo; copy `.env.example` → `.env`                                                                     |
| **preview**    | Railway **staging** API | Vercel PR preview (`*.vercel.app` on `banal-web-staging`)  | `app_staging` (via staging API) | CORS via `WEB_ORIGIN` + `WEB_ORIGIN_PREVIEW_REGEX`; interim SameSite=None                                              |
| **staging**    | Railway staging service | `https://banal-web-staging.vercel.app`                     | `app_staging`                   | Separate Vercel project from prod                                                                                      |
| **production** | Railway prod service    | Planned: `https://app.banal.app` (interim: `*.vercel.app`) | `btw` (legacy shared DB)        | Custom domains + SameSite=Lax ([cookie-cutover.md](../deploy/cookie-cutover.md)); interim SameSite=None until DNS live |

CI (GitHub Actions e2e) uses Docker `mongo:7` and DB name **`app_foundation_ci`** — never Atlas staging or prod.

## Key variables by environment

| Variable                      | local                      | preview / staging                            | production                                                                      |
| ----------------------------- | -------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------- |
| `MONGODB_URI`                 | `…/app_foundation_dev`     | Atlas → `app_staging`                        | Atlas → `btw` (legacy shared DB)                                                |
| `WEB_ORIGIN`                  | `http://localhost:3000`    | `https://banal-web-staging.vercel.app`       | `https://app.banal.app` (interim: `https://banal-web-production.vercel.app`)    |
| `WEB_ORIGIN_PREVIEW_REGEX`    | unset                      | `^https://.*\.vercel\.app$`                  | unset (or empty)                                                                |
| `WEB_ORIGIN_PREVIEW_LIST`     | unset                      | optional comma-separated URLs                | unset                                                                           |
| `VITE_API_URL` (web only)     | `http://localhost:4000`    | `https://api-staging-9c27.up.railway.app`    | `https://api.banal.app` (interim: `https://api-production-b6c9.up.railway.app`) |
| `JWT_ACCESS_SECRET` / refresh | local `.env` (≥32 chars)   | Railway staging                              | Railway prod                                                                    |
| `COOKIE_DOMAIN`               | unset (host-only)          | unset                                        | `.banal.app` (after custom domains live)                                        |
| `AUTH_COOKIE_SAMESITE`        | `lax`                      | `none` (cross-site `*.vercel.app` ↔ Railway) | `lax` after cutover; `none` interim until DNS live                              |
| `AUTH_REGISTRATION_ENABLED`   | `true` / `false` as needed | per environment policy                       | usually `false` until open                                                      |
| `TRUST_PROXY`                 | `0` / unset                | `1` on Railway                               | `1` on Railway                                                                  |
| `OTEL_ENABLED`                | `false`                    | optional                                     | optional                                                                        |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset                      | required if OTEL on                          | required if OTEL on                                                             |

OTel wiring: [observability.md](observability.md). Alerting stub: [alerting.md](alerting.md).

## Atlas DB naming

| Environment | DB name              | Where set                        |
| ----------- | -------------------- | -------------------------------- |
| Local       | `app_foundation_dev` | `apps/api/.env`                  |
| CI          | `app_foundation_ci`  | `.github/workflows/ci.yml`       |
| Staging     | `app_staging`        | Railway staging `MONGODB_URI`    |
| Production  | `btw` (legacy)       | Railway production `MONGODB_URI` |

Since 2026-07-25 production connects to the **legacy shared database `btw`** on Atlas (ADR-001 strangler layout; app-owned collections are `_foundation_*` / `a_*`, legacy collections read-only). The interim Railway-managed MongoDB was removed.

**Rule:** CI and local **never** use Atlas URIs that point at `btw` or `app_staging`. Aligns with ADR-001 (prod Mongo not in CI). Full Atlas URI params and network allowlist: [deploy/atlas.md](../deploy/atlas.md).

## Secrets placement

| Store                     | Allowed content                                                                  |
| ------------------------- | -------------------------------------------------------------------------------- |
| Railway (API)             | JWT secrets, `MONGODB_URI`, cookie/CORS/OTEL vars                                |
| Vercel (web)              | **Only** public `VITE_*` (e.g. `VITE_API_URL`)                                   |
| GitHub Actions CI         | Dummy JWT + `mongo:7` / `app_foundation_ci`                                      |
| GitHub Environments (T24) | Public smoke URLs only (`API_BASE_URL`, `WEB_BASE_URL`); **no** JWT/Mongo/tokens |
| Local `apps/*/.env`       | Full API secrets; gitignored                                                     |
| Git / Vite client bundle  | **Never** secrets                                                                |

Setup checklist: [deploy/README.md](../deploy/README.md)#github-environments-smoke-only, [secrets-checklist.md](secrets-checklist.md)#github-environments-t24.

## Preview CORS plan

1. Primary allowlist entry: exact `WEB_ORIGIN` (staging or prod web URL).
2. Optional `WEB_ORIGIN_PREVIEW_LIST`: comma-separated absolute origins.
3. Optional `WEB_ORIGIN_PREVIEW_REGEX`: RegExp source; invalid patterns are ignored (fail-safe).
4. Cookie profile for cross-site Vercel↔Railway previews: interim `AUTH_COOKIE_SAMESITE=none` (T22 step 212). Production uses Lax + `COOKIE_DOMAIN=.banal.app` on `app.` / `api.` ([deploy/README.md](../deploy/README.md)#custom-domains-t23--domain-plan, [cookie-cutover.md](../deploy/cookie-cutover.md)).

Implementation: `apps/api/src/cors.options.ts`.

## Related

- [secrets-checklist.md](secrets-checklist.md) — where each secret lives + JWT rotation
- [feature-flags.md](feature-flags.md) — env feature flags (registration, legacy writes)
- [incident-rollback.md](incident-rollback.md)
- [deploy/railway.md](../deploy/railway.md) — `TRUST_PROXY=1` note (full runbook T21)
- [deploy/vercel.md](../deploy/vercel.md) — web Root Directory `apps/web`, `VITE_API_URL` (T22)
- [deploy/cookie-cutover.md](../deploy/cookie-cutover.md) — T23 custom domains + prod cookies
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — Track 12
