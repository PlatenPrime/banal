# Railway (API) — deploy runbook

Deploy `@app/api` to Railway (Track **T21**). Secrets: [ops/secrets-checklist.md](../ops/secrets-checklist.md). Env matrix: [ops/environments.md](../ops/environments.md). Atlas: [atlas.md](atlas.md). Rollback: [ops/incident-rollback.md](../ops/incident-rollback.md).

**Staging and production are separate Railway services** with separate Atlas DB names (`app_staging` / `app_prod`) and distinct JWT secrets.

## Prerequisites

- GitHub repo connected to Railway.
- Atlas DB users + Network Access ready (see [Atlas network (Railway)](#atlas-network-railway)).
- Local auth e2e green before first staging push (platform rule).
- Docker image builds locally:

```bash
docker build -f apps/api/Dockerfile -t banal-api .
```

## Service create (copy-paste)

Do this twice: once for **staging**, once for **production**.

1. Railway → **New Project** (or existing) → **New Service** → **GitHub Repo** → select this monorepo.
2. Service settings:
   - **Root Directory:** leave empty / `/` (repo root). **Do not** set `apps/api` — the Docker build context must include `libs/shared-contracts` and the root lockfile.
   - **Builder:** Dockerfile (config-as-code from [`railway.toml`](../../railway.toml)).
   - **Dockerfile path:** `apps/api/Dockerfile` (also set in `railway.toml`).
3. Confirm [`railway.toml`](../../railway.toml) is at the **repo root** (Railway discovers it when Root Directory is `/`):
   - `healthcheckPath = "/health"`
   - `restartPolicyType = "ON_FAILURE"`
4. Attach a public HTTPS domain (Railway generates `*.up.railway.app`; custom `api.` domain is T23).
5. Set variables from the [env mapping table](#env-mapping-railway--api-zod) below. Required: `TRUST_PROXY=1`, `NODE_ENV=production`, Atlas `MONGODB_URI`, JWT pair ≥32 chars and **different** from each other and from the other environment.
6. Deploy from `main` (or the branch configured for this service). Wait for healthcheck green.
7. Smoke: [Staging / production smoke](#smoke).

### Local image smoke (optional)

```bash
docker compose up -d mongo
docker run --rm --network banal_default -p 4400:4000 \
  -e NODE_ENV=production \
  -e PORT=4000 \
  -e MONGODB_URI=mongodb://mongo:27017/app_docker_smoke \
  -e WEB_ORIGIN=http://localhost:3000 \
  -e JWT_ACCESS_SECRET=docker-smoke-access-secret-32chars \
  -e JWT_REFRESH_SECRET=docker-smoke-refresh-secret-32ch \
  -e TRUST_PROXY=1 \
  banal-api
curl -sS http://127.0.0.1:4400/health
curl -sS http://127.0.0.1:4400/health/ready
```

On Windows PowerShell use `curl.exe` and the same `-e` flags.

## TRUST_PROXY

Railway terminates TLS and proxies to the Nest process. For Secure cookies and correct client IP behavior, set:

```text
TRUST_PROXY=1
```

Local development should keep `TRUST_PROXY=0` (or omit). Nest wires `app.set('trust proxy', 1)` when `TRUST_PROXY` is truthy (T16 step 151).

## PORT binding

Railway injects `PORT`. The API reads it via Zod (`apps/api/src/config/env.schema.ts`) and `app.listen(config.get('PORT'))` in `apps/api/src/main.ts`. Do **not** hardcode `4000` in Railway; omit `PORT` or leave Railway’s value. Local Docker may set `PORT=4000` explicitly.

## Monorepo / `@app/shared-contracts`

The image runs `npx nx run api:build` in the builder stage (depends on `shared-contracts:build`). The runner copies:

- `libs/shared-contracts/dist`
- `apps/api/dist`

Workspace package `@app/shared-contracts` resolves via npm workspaces at runtime. If boot fails with `Cannot find module '@app/shared-contracts'`, the image was built with the wrong context (not repo root) or dist was not copied.

## Graceful shutdown (SIGTERM)

Nest enables `app.enableShutdownHooks()` in `apps/api/src/main.ts`; `app.close` also shuts down OpenTelemetry. Railway sends **SIGTERM** on deploy/scale-down. **Verified 2026-07-23:** staging/production redeploys completed without crash loops after image swap (Railway drains old replica on SIGTERM; new replica passed `/health`).

## Env mapping (Railway ↔ API Zod)

Every variable mirrors [`apps/api/src/config/env.schema.ts`](../../apps/api/src/config/env.schema.ts). Keep this table in sync with [ops/secrets-checklist.md](../ops/secrets-checklist.md).

| Variable                      | Staging                             | Production                       | Required | Notes                                              |
| ----------------------------- | ----------------------------------- | -------------------------------- | -------- | -------------------------------------------------- |
| `NODE_ENV`                    | `production`                        | `production`                     | yes      |                                                    |
| `PORT`                        | (Railway injects)                   | (Railway injects)                | yes\*    | Usually omit in dashboard                          |
| `MONGODB_URI`                 | Railway Mongo / Atlas `app_staging` | Railway Mongo / Atlas `app_prod` | yes      | Live: `${{MongoDB.MONGO_URL}}`; Atlas when swapped |
| `WEB_ORIGIN`                  | Vercel staging / preview origin     | Vercel prod origin               | yes      | Exact origin URL; T22 wires web                    |
| `WEB_ORIGIN_PREVIEW_REGEX`    | optional Vercel preview pattern     | usually unset                    | no       |                                                    |
| `WEB_ORIGIN_PREVIEW_LIST`     | optional CSV                        | usually unset                    | no       |                                                    |
| `JWT_ACCESS_SECRET`           | ≥32 chars, staging-only             | ≥32 chars, **prod-only**         | yes      | Never reuse across envs                            |
| `JWT_REFRESH_SECRET`          | ≥32 chars, ≠ access                 | ≥32 chars, ≠ access, ≠ staging   | yes      |                                                    |
| `COOKIE_DOMAIN`               | unset until T23                     | e.g. `.example.com` after T23    | prod     |                                                    |
| `AUTH_COOKIE_SAMESITE`        | `none` interim for previews         | `lax` after custom domains (T23) | yes      |                                                    |
| `AUTH_REGISTRATION_ENABLED`   | `false` (default)                   | `false`                          | yes      | Enable only when intentionally open                |
| `TRUST_PROXY`                 | `1`                                 | `1`                              | yes      | Required on Railway                                |
| `OTEL_ENABLED`                | `false`                             | `false`                          | no       |                                                    |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | if OTEL on                          | if OTEL on                       | if OTEL  |                                                    |

\*Zod defaults `PORT` to `4000` if unset; Railway always provides `PORT` in practice.

### Prod secrets sign-off (step 200)

Before marking production live:

- [x] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are each ≥32 random characters. (set 2026-07-23 via Railway CLI)
- [x] Prod secrets **differ** from staging (and from each other).
- [x] `MONGODB_URI` on prod points at the production environment Mongo (Railway plugin; swap to Atlas `app_prod` when ready).
- [x] Values exist only in Railway Variables — not in git, chat, or `VITE_*`.

## Atlas network (Railway)

**Recorded approach (2026-07-23, T21-197):** staging and production use **Railway-managed MongoDB** (private network `*.railway.internal`) via `MONGODB_URI=${{MongoDB.MONGO_URL}}`. No public Atlas allowlist required for this interim. `/health/ready` returned 200 on both environments.

When swapping to **Mongo Atlas** (legacy shared cluster):

| Approach                        | When to use                                      | Risk                          |
| ------------------------------- | ------------------------------------------------ | ----------------------------- |
| Atlas IP allowlist (egress IPs) | Stable Railway static egress / documented ranges | Must update if egress changes |
| Temporary `0.0.0.0/0`           | Dynamic egress, no private link yet              | Open internet; revisit ASAP   |

Until Atlas URI is set on Railway Variables, keep the Railway Mongo plugin. See [atlas.md](atlas.md)#network-access.

## Service URLs

| Environment | Railway project / env  | Public API base URL                          | Recorded   |
| ----------- | ---------------------- | -------------------------------------------- | ---------- |
| Staging     | `banal` / `staging`    | `https://api-staging-9c27.up.railway.app`    | 2026-07-23 |
| Production  | `banal` / `production` | `https://api-production-b6c9.up.railway.app` | 2026-07-23 |

Project id: `534fc942-8837-40df-8dbe-7e76f6c6e3ca`. Service: `api`. Also in [track-platform-acceptance.md](../track-platform-acceptance.md).

## Smoke

Script (from repo root):

```bash
# Unix / Git Bash
API_BASE_URL=https://api-staging-9c27.up.railway.app ./scripts/smoke-api.sh

# Optional login smoke (needs a user in a_users)
API_BASE_URL=https://api-staging-9c27.up.railway.app \
  SMOKE_USER=admin SMOKE_PASSWORD='…' ./scripts/smoke-api.sh
```

PowerShell:

```powershell
$env:API_BASE_URL = "https://api-staging-9c27.up.railway.app"
node ./scripts/smoke-api.mjs
```

**Verified 2026-07-23:** staging and production `/health` + `/health/ready` → 200 via `scripts/smoke-api.mjs`. Login smoke is optional until an admin is bootstrapped (`nx run api:bootstrap-admin` / Railway run).

## Logs

API logs are **newline-delimited JSON** on stdout (nestjs-pino). There is no pretty transport in staging/prod.

### Where to read

1. Railway dashboard → API service → **Logs** (live stream of container stdout/stderr).
2. CLI (when the service exists): `railway logs` against the linked project/service.

### Useful fields

| Field       | Meaning                                     |
| ----------- | ------------------------------------------- |
| `level`     | pino numeric level (`info` default in prod) |
| `msg`       | message                                     |
| `requestId` | correlation id (same as `x-request-id`)     |
| `req` / URL | request shape from the logging interceptor  |

Filter in the UI/CLI by `requestId` (or the echoed `x-request-id` from a client) to reconstruct one request.

Secrets (Mongo URI, passwords, JWT/cookie/`Authorization`) are **redacted** to `[Redacted]` — see logger redact paths.

### Retention

Retention follows **Railway’s platform policy** for the service plan (no external ELK/Datadog required for platform-v1). Do not assume infinite history; copy incident lines into the incident note when needed. Optional OTLP tracing is separate — see [ops/observability.md](../ops/observability.md).

## Rollback

See [ops/incident-rollback.md](../ops/incident-rollback.md)#railway-api. Summary: Deployments → last known-good → **Redeploy**; smoke `/health` + `/health/ready`; confirm env unchanged.

**Dry-run note:** Staging Deployments UI lists prior revisions with Redeploy available (confirmed 2026-07-23 during T21). Practice: open Deployments → select previous green → Redeploy on **staging only** → re-run `scripts/smoke-api.mjs`. Recorded in [track-21-railway-api-deploy-freeze.md](../track-21-railway-api-deploy-freeze.md).

## Related

- [atlas.md](atlas.md) — Atlas URI params, network allowlist policy, readiness
- [ops/observability.md](../ops/observability.md) — request-id ↔ logs/traces
- [ops/alerting.md](../ops/alerting.md) — alerting stub (no required SaaS)
- [LOCAL_SETUP.md](../LOCAL_SETUP.md)#trust_proxy
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T21 Railway API
- [incident-rollback.md](../ops/incident-rollback.md)
- [`apps/api/Dockerfile`](../../apps/api/Dockerfile)
- [`railway.toml`](../../railway.toml)
