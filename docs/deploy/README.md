# Deploy docs

Index for platform deploy runbooks (T13–T24) and linked ops. Platform freeze: [track-platform-acceptance.md](../track-platform-acceptance.md) (`platform-v1.0.0`).

| Doc                                                     | Status     | Scope                                                    |
| ------------------------------------------------------- | ---------- | -------------------------------------------------------- |
| [atlas.md](atlas.md)                                    | done (T13) | Connection URI policy; network access; readiness         |
| [railway.md](railway.md)                                | done (T21) | API on Railway; Dockerfile; env mapping; smoke; rollback |
| [vercel.md](vercel.md)                                  | done (T22) | Web on Vercel; monorepo Root Directory; SSR smoke        |
| [cookie-cutover.md](cookie-cutover.md)                  | done (T23) | Preview → prod cookie profile; DNS gate; rollback        |
| This file — [Deploy automation](#deploy-automation-t24) | done (T24) | Strategy lock; Environments; smoke workflow; permissions |

### Ops runbooks (linked)

| Doc                                                     | Scope                                              |
| ------------------------------------------------------- | -------------------------------------------------- |
| [ops/environments.md](../ops/environments.md)           | Env matrix; naming; local vs staging/prod          |
| [ops/secrets-checklist.md](../ops/secrets-checklist.md) | Secret placement; GH Environments; least privilege |
| [ops/incident-rollback.md](../ops/incident-rollback.md) | Railway / Vercel rollback paths                    |
| [ops/observability.md](../ops/observability.md)         | Logging / OTel behind flag                         |
| [ops/alerting.md](../ops/alerting.md)                   | Alert ownership notes                              |
| [ops/feature-flags.md](../ops/feature-flags.md)         | Feature flag ops                                   |

Quick links: Atlas → [atlas.md](atlas.md) · Railway → [railway.md](railway.md) · Vercel → [vercel.md](vercel.md) · Cookies → [cookie-cutover.md](cookie-cutover.md) · Automation → [below](#deploy-automation-t24).

## Deploy automation (T24)

**Decision locked (2026-07-25):** Actions does **not** deploy. Platforms deploy via native Git; Actions only smokes health after deploy.

| Layer | Who deploys                   | Policy                                                                                                                                                                                                                                                                                                            |
| ----- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Web   | **Vercel GitHub integration** | Both `banal-web-staging` and `banal-web-production`: Production Branch **`main`**. Staging allows PR previews; production skips preview builds (Ignored Build Step). Details: [vercel.md](vercel.md)#git--production-branch-t24.                                                                                  |
| API   | **Railway GitHub deploy**     | Staging service: watch / auto-deploy **`main`**. Production: **manual** Redeploy / promote (no auto-deploy on every `main` push). Details: [railway.md](railway.md)#watch--promote-t24.                                                                                                                           |
| Smoke | **Optional** GitHub Actions   | [`.github/workflows/deploy-smoke.yml`](../../.github/workflows/deploy-smoke.yml): `workflow_dispatch` + `push` to `main` → staging only. Uses Environment vars `API_BASE_URL` / `WEB_BASE_URL` + [`scripts/smoke-api.mjs`](../../scripts/smoke-api.mjs) / [`scripts/smoke-web.mjs`](../../scripts/smoke-web.mjs). |

### GitHub Environments (smoke only)

| Environment  | Required reviewers  | Variables (public URLs — not Secrets)                                                                                                                                              | Notes                                        |
| ------------ | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| `staging`    | off                 | `API_BASE_URL=https://api-staging-9c27.up.railway.app`, `WEB_BASE_URL=https://banal-web-staging.vercel.app`                                                                        | Auto smoke on push to `main`                 |
| `production` | **on** (repo owner) | Interim: `API_BASE_URL=https://api-production-b6c9.up.railway.app`, `WEB_BASE_URL=https://banal-web-production.vercel.app` (after T23 cutover → `api.banal.app` / `app.banal.app`) | Smoke only via `workflow_dispatch` + Approve |

**Do not** store JWT, Mongo URIs, or Railway/Vercel tokens in GitHub Environments. App secrets stay on Railway/Vercel. Placement: [ops/secrets-checklist.md](../ops/secrets-checklist.md)#github-environments-t24.

**Owner setup (live gate):** create `staging` / `production` under Settings → Environments if missing; set variables above; enable Required reviewers on `production`. Freeze evidence: [track-24-cicd-deploy-automation-freeze.md](../track-24-cicd-deploy-automation-freeze.md).

### Optional Playwright against staging

Not wired as a default GHA job. To run locally or as a future nightly/post-deploy job against staging:

```bash
# Point client + Playwright at staging (cross-site SameSite=None profile)
export VITE_API_URL=https://api-staging-9c27.up.railway.app
export WEB_BASE_URL=https://banal-web-staging.vercel.app
# Staging needs a bootstrapped e2e user (Railway one-off or known test account)
npx nx run web-e2e:e2e
```

Auth e2e against staging needs credentials that exist in `app_staging` / Railway Mongo — do **not** put those passwords in Actions logs. Prefer local or a protected Environment with masked secrets if you add a job later. See [testing.md](../testing.md)#optional-playwright-against-staging-t24.

### Secrets in Actions logs + deploy permissions

- Smoke workflow prints only HTTP status lines from public `/health` and SSR pages — no env dumps, no `SMOKE_PASSWORD` / JWT.
- If a future job needs a sensitive input, mask it (`::add-mask::`) and store it as an Environment **secret**, never `echo` it.
- Workflow permissions: `contents: read` only. **No** `RAILWAY_TOKEN` / `VERCEL_TOKEN` in Actions for the T24 path (Git integrations own deploy).
- Least privilege: Environments scope which URLs a job may smoke; production smoke requires a human reviewer.

## Custom domains (T23) — domain plan

**Planned parent:** `banal.app` (brand default; rename in one pass across deploy/ops docs if a different parent is purchased).

| Host            | Platform                              | Purpose        | DNS (typical)                                 |
| --------------- | ------------------------------------- | -------------- | --------------------------------------------- |
| `app.banal.app` | Vercel project `banal-web-production` | Production web | CNAME → Vercel target shown in Domains UI     |
| `api.banal.app` | Railway service `api` (production)    | Production API | CNAME → Railway target shown in Networking UI |

**Staging / preview:** no custom domains. Keep `*.vercel.app` ↔ Railway staging with `AUTH_COOKIE_SAMESITE=none` and `WEB_ORIGIN_PREVIEW_REGEX`.

### Production cookie / CORS profile (after DNS + TLS)

| Variable               | Production value                |
| ---------------------- | ------------------------------- |
| `VITE_API_URL`         | `https://api.banal.app`         |
| `WEB_ORIGIN`           | `https://app.banal.app` (exact) |
| `COOKIE_DOMAIN`        | `.banal.app`                    |
| `AUTH_COOKIE_SAMESITE` | `lax`                           |
| Preview regex / list   | **unset** on production API     |

Cutover order and rollback: [cookie-cutover.md](cookie-cutover.md). HSTS: [HSTS](cookie-cutover.md#hsts). Per-platform attach steps: [vercel.md](vercel.md)#custom-domain-appbanalapp, [railway.md](railway.md)#custom-domain-apibanalapp.

### Ownership gate

Live TLS padlock and env cutover require the parent domain to be registered and DNS editable. Until then, interim prod URLs remain `banal-web-production.vercel.app` / `api-production-b6c9.up.railway.app` with `SameSite=None`.
