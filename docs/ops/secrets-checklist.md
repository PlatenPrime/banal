# Secrets checklist

Where secrets and sensitive env vars live for banal (Track 12). Environment matrix: [environments.md](environments.md). Security policy: [SECURITY.md](../../SECURITY.md). Rollback: [incident-rollback.md](incident-rollback.md).

**Never** commit real secrets, put them in `VITE_*`, or paste them into public docs / issues.

## Railway (API — staging and production)

Separate services for staging and production. Full list mirrors `apps/api` Zod schema ([`env.schema.ts`](../../apps/api/src/config/env.schema.ts)).

| Variable                      | Required | Notes                                            |
| ----------------------------- | -------- | ------------------------------------------------ |
| `NODE_ENV`                    | yes      | `production`                                     |
| `PORT`                        | yes      | Often set by Railway                             |
| `MONGODB_URI`                 | yes      | Atlas; DB name `app_staging` or `app_prod`       |
| `WEB_ORIGIN`                  | yes      | Exact web origin URL                             |
| `WEB_ORIGIN_PREVIEW_REGEX`    | no       | Staging: Vercel preview pattern                  |
| `WEB_ORIGIN_PREVIEW_LIST`     | no       | Comma-separated extra origins                    |
| `JWT_ACCESS_SECRET`           | yes      | ≥32 chars; unique per environment                |
| `JWT_REFRESH_SECRET`          | yes      | ≥32 chars; **must differ** from access secret    |
| `COOKIE_DOMAIN`               | prod     | `.banal.app` after custom domains live (T23)     |
| `AUTH_COOKIE_SAMESITE`        | yes      | `lax` prod after cutover; `none` staging/preview |
| `AUTH_REGISTRATION_ENABLED`   | yes      | Default `false`                                  |
| `TRUST_PROXY`                 | yes      | **`1`** on Railway (Secure cookies behind proxy) |
| `OTEL_ENABLED`                | no       | Default `false`                                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | if OTEL  | Required when `OTEL_ENABLED=true`                |

Full per-environment mapping and Railway dashboard steps: [deploy/railway.md](../deploy/railway.md)#env-mapping-railway--api-zod.

## Vercel (web)

Separate projects for staging and production. Full runbook: [deploy/vercel.md](../deploy/vercel.md).

| Variable       | Staging (`banal-web-staging`)             | Production (`banal-web-production`)                                             | Required | Notes                                      |
| -------------- | ----------------------------------------- | ------------------------------------------------------------------------------- | -------- | ------------------------------------------ |
| `VITE_API_URL` | `https://api-staging-9c27.up.railway.app` | `https://api.banal.app` (interim: `https://api-production-b6c9.up.railway.app`) | yes      | Absolute API base URL for that environment |

**No** JWT secrets, Mongo URIs, or other API secrets on Vercel. Vite embeds `VITE_*` into the client bundle.

Recorded web origins (2026-07-25): staging `https://banal-web-staging.vercel.app`; production planned `https://app.banal.app` (interim `https://banal-web-production.vercel.app`). Cutover: [deploy/cookie-cutover.md](../deploy/cookie-cutover.md).

## GitHub

| Context             | Content                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Actions CI (e2e)    | `mongo:7` service; `MONGODB_URI=…/app_foundation_ci`; dummy JWT secrets |
| GitHub Environments | **Smoke URLs only** (T24) — see below                                   |
| Repository secrets  | Prefer Environments over org-wide when possible                         |

CI must **never** receive Atlas prod/staging URIs.

### GitHub Environments (T24)

Environments `staging` and `production` exist for [`.github/workflows/deploy-smoke.yml`](../../.github/workflows/deploy-smoke.yml) only. They hold **public base URLs**, not app secrets.

| Environment  | Variables                                                                                                  | Secrets | Protection                          |
| ------------ | ---------------------------------------------------------------------------------------------------------- | ------- | ----------------------------------- |
| `staging`    | `API_BASE_URL`, `WEB_BASE_URL` (staging Railway / Vercel hosts)                                            | none    | none                                |
| `production` | `API_BASE_URL`, `WEB_BASE_URL` (interim `*.up.railway.app` / `*.vercel.app`; after cutover custom domains) | none    | **Required reviewers** (repo owner) |

**Never** put in Environments: `JWT_*`, `MONGODB_URI`, `SMOKE_PASSWORD`, `RAILWAY_TOKEN`, `VERCEL_TOKEN`.

#### No prod secrets in Actions logs

- Do not `echo`, `printenv`, or debug-dump Environment / repository secrets.
- Deploy smoke does not pass login credentials; health/SSR only.
- If a future job needs a sensitive value: store as an Environment **secret**, use `${{ secrets.NAME }}` without logging, and `echo "::add-mask::$VALUE"` when a step must materialize it into the shell.

#### Deploy permissions (least privilege)

- Deploy smoke workflow: `permissions: contents: read` only; jobs bind `environment:` for URL vars.
- **No** platform deploy tokens in Actions — Vercel Git + Railway GitHub own deploys ([deploy/README.md](../deploy/README.md)#deploy-automation-t24).
- Do not grant Actions `contents: write` or org-wide admin tokens for smoke.

## Local

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

- `apps/api/.env` and `apps/web/.env` are gitignored.
- Use placeholder-length JWT secrets locally (≥32 chars); do not reuse production values.
- See [LOCAL_SETUP.md](../LOCAL_SETUP.md).

## JWT secret rotation

Rotating `JWT_ACCESS_SECRET` and/or `JWT_REFRESH_SECRET` **invalidates all existing sessions**.

1. Generate two new independent secrets (≥32 random characters each).
2. Update both values on the target Railway service (staging or production).
3. Redeploy the API so the new schema-validated env is loaded.
4. Users must sign in again; refresh tokens signed with the old secret will fail verification.
5. Record the change in the incident note if done under pressure; coordinate with [incident-rollback.md](incident-rollback.md) if a bad deploy prompted the rotation.

Prefer rotating **access and refresh together** so there is no mixed-secret window. Do not put rotation values in git or chat logs.

## Related

- [environments.md](environments.md)
- [SECURITY.md](../../SECURITY.md)
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — Track 12 / T24
- [deploy/README.md](../deploy/README.md)#deploy-automation-t24
- [track-24-cicd-deploy-automation-freeze.md](../track-24-cicd-deploy-automation-freeze.md)
