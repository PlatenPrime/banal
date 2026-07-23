# Environments matrix

Canonical definition of **local**, **preview**, **staging**, and **production** for the banal platform (Track 12). Deploy runbooks: [deploy/README.md](../deploy/README.md) (stubs until T21–T22). Secrets placement: [secrets-checklist.md](secrets-checklist.md). Local runbook: [LOCAL_SETUP.md](../LOCAL_SETUP.md). Shared Mongo policy: [ADR-001](../adr/001-shared-mongodb-with-legacy.md).

## Matrix

| Env            | API                          | Web                                | Mongo DB name                   | Notes                                                                   |
| -------------- | ---------------------------- | ---------------------------------- | ------------------------------- | ----------------------------------------------------------------------- |
| **local**      | `localhost:4000` (Nest)      | `localhost:3000` (Vite)            | `app_foundation_dev`            | Docker Compose Mongo; copy `.env.example` → `.env`                      |
| **preview**    | Railway **staging** API      | Vercel PR preview (`*.vercel.app`) | `app_staging` (via staging API) | CORS via `WEB_ORIGIN` + preview regex/list; interim SameSite=None (T22) |
| **staging**    | Railway staging service      | Vercel staging / preview prod      | `app_staging`                   | Separate Railway service from prod                                      |
| **production** | Railway prod (`api.` domain) | Vercel prod (`app.` domain)        | `app_prod`                      | Custom domains + SameSite=Lax (T23)                                     |

CI (GitHub Actions e2e) uses Docker `mongo:7` and DB name **`app_foundation_ci`** — never Atlas staging or prod.

## Key variables by environment

| Variable                      | local                      | preview / staging                | production                 |
| ----------------------------- | -------------------------- | -------------------------------- | -------------------------- |
| `MONGODB_URI`                 | `…/app_foundation_dev`     | Atlas → `app_staging`            | Atlas → `app_prod`         |
| `WEB_ORIGIN`                  | `http://localhost:3000`    | staging web URL                  | `https://app.<domain>`     |
| `WEB_ORIGIN_PREVIEW_REGEX`    | unset                      | e.g. `^https://.*\.vercel\.app$` | unset (or empty)           |
| `WEB_ORIGIN_PREVIEW_LIST`     | unset                      | optional comma-separated URLs    | unset                      |
| `VITE_API_URL` (web only)     | `http://localhost:4000`    | staging API URL                  | `https://api.<domain>`     |
| `JWT_ACCESS_SECRET` / refresh | local `.env` (≥32 chars)   | Railway staging                  | Railway prod               |
| `COOKIE_DOMAIN`               | unset (host-only)          | unset or staging host            | `.example.com`             |
| `AUTH_COOKIE_SAMESITE`        | `lax`                      | `none` interim for previews      | `lax`                      |
| `AUTH_REGISTRATION_ENABLED`   | `true` / `false` as needed | per environment policy           | usually `false` until open |
| `TRUST_PROXY`                 | `0` / unset                | `1` on Railway                   | `1` on Railway             |
| `OTEL_ENABLED`                | `false`                    | optional                         | optional                   |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | unset                      | required if OTEL on              | required if OTEL on        |

## Atlas DB naming

| Environment | DB name              | Where set                        |
| ----------- | -------------------- | -------------------------------- |
| Local       | `app_foundation_dev` | `apps/api/.env`                  |
| CI          | `app_foundation_ci`  | `.github/workflows/ci.yml`       |
| Staging     | `app_staging`        | Railway staging `MONGODB_URI`    |
| Production  | `app_prod`           | Railway production `MONGODB_URI` |

**Rule:** CI and local **never** use Atlas URIs that point at `app_prod` or `app_staging`. Aligns with ADR-001 (prod Mongo not in CI). Full Atlas URI params and network allowlist: [deploy/atlas.md](../deploy/atlas.md).

## Secrets placement

| Store                         | Allowed content                                   |
| ----------------------------- | ------------------------------------------------- |
| Railway (API)                 | JWT secrets, `MONGODB_URI`, cookie/CORS/OTEL vars |
| Vercel (web)                  | **Only** public `VITE_*` (e.g. `VITE_API_URL`)    |
| GitHub Actions / Environments | CI dummy JWT + `mongo:7`; deploy secrets in T24   |
| Local `apps/*/.env`           | Full API secrets; gitignored                      |
| Git / Vite client bundle      | **Never** secrets                                 |

## Preview CORS plan

1. Primary allowlist entry: exact `WEB_ORIGIN` (staging or prod web URL).
2. Optional `WEB_ORIGIN_PREVIEW_LIST`: comma-separated absolute origins.
3. Optional `WEB_ORIGIN_PREVIEW_REGEX`: RegExp source; invalid patterns are ignored (fail-safe).
4. Cookie profile for cross-site Vercel↔Railway previews: interim `AUTH_COOKIE_SAMESITE=none` (T22 step 212). Production uses Lax + shared parent domain (T23).

Implementation: `apps/api/src/cors.options.ts`.

## Related

- [secrets-checklist.md](secrets-checklist.md) — where each secret lives + JWT rotation
- [feature-flags.md](feature-flags.md) — env feature flags (registration, legacy writes)
- [incident-rollback.md](incident-rollback.md)
- [deploy/railway.md](../deploy/railway.md) — `TRUST_PROXY=1` note (full runbook T21)
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — Track 12
