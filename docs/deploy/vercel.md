# Vercel (Web) — deploy runbook

Deploy `@app/web` (TanStack Start + Nitro) to Vercel (Track **T22**). Secrets: [ops/secrets-checklist.md](../ops/secrets-checklist.md). Env matrix: [ops/environments.md](../ops/environments.md). API: [railway.md](railway.md). Rollback: [ops/incident-rollback.md](../ops/incident-rollback.md).

**Staging and production are separate Vercel projects** with distinct `VITE_API_URL` values pointing at the matching Railway API. Custom domains (`app.`) are **T23**.

## Prerequisites

- GitHub repo connected to Vercel (Git integration).
- Railway staging + production API live ([railway.md](railway.md)#service-urls).
- Local auth e2e green before first staging push (platform rule).
- Local web build OK:

```bash
npx nx run web:build
```

Nitro is registered in [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts) (`nitro()`). On Vercel, Nitro auto-selects the `vercel` preset and writes Build Output API under `apps/web/.vercel/output`. Local builds keep the `node-server` preset under `.output/`.

## Project create (copy-paste)

Do this twice: once for **staging** (`banal-web-staging`), once for **production** (`banal-web-production`).

1. Vercel → **Add New…** → **Project** → import this monorepo (`PlatenPrime/banal`).
2. Project settings:
   - **Root Directory:** `apps/web` (required — Nitro emits `.vercel/output` relative to the Vite app). **Do not** leave Root Directory at `/`; a root-level build will not find the TanStack Start entry.
   - **Include files outside the Root Directory:** on (npm workspaces + root lockfile).
   - **Framework Preset:** `TanStack Start` (`tanstack-start`).
   - **Node.js Version:** `24.x` (matches root `engines.node`).
   - **Build Command:** `npm run build` (from [`apps/web/vercel.json`](../../apps/web/vercel.json); Vercel may auto-detect).
   - **Install Command:** leave auto (Vercel runs install at the monorepo root when Root Directory is nested).
3. Set `VITE_API_URL` for Production, Preview, and Development (see [env mapping](#env-mapping-vercel--web-zod)).
4. Git:
   - **Staging:** Production Branch `main`; PR / branch **Preview** deployments **enabled**.
   - **Production:** Production Branch `main`; skip Preview builds via Ignored Build Step:
     `if [ "$VERCEL_ENV" = "preview" ]; then exit 0; else exit 1; fi`
5. Deploy Production. Wait for READY.
6. Smoke: [Smoke](#smoke). Wire Railway `WEB_ORIGIN` / cookies (see below).

### CLI (agent / CI-friendly)

```bash
npm i -g vercel@latest
vercel login
vercel project add banal-web-staging
vercel project add banal-web-production
vercel project update banal-web-staging --framework tanstack-start
vercel project update banal-web-production --framework tanstack-start
# Root Directory via API (CLI has no --root-directory flag as of v57):
# PATCH /v9/projects/{name} { "rootDirectory": "apps/web" }
vercel env add VITE_API_URL production --project banal-web-staging --value https://api-staging-9c27.up.railway.app --yes
# …repeat for preview + development; mirror for production project with prod API URL
vercel link --yes --project banal-web-staging
vercel git connect https://github.com/PlatenPrime/banal.git --yes
vercel deploy --prod --yes
```

Config-as-code in-repo: [`apps/web/vercel.json`](../../apps/web/vercel.json) (`framework: tanstack-start`, `buildCommand: npm run build`).

## Why Root Directory = `apps/web`

| Approach                                | Result                                                                                         |
| --------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Root Directory `/` + `nx run web:build` | Nitro writes `apps/web/.vercel/output`; Vercel looks at repo-root output → fail / wrong layout |
| Root Directory `apps/web`               | Install from monorepo root; build cwd = Vite app; `.vercel/output` matches Build Output API    |

The post-build gate [`apps/web/scripts/assert-web-build-output.mjs`](../../apps/web/scripts/assert-web-build-output.mjs) is **preset-aware**: when `VERCEL=1` it requires `.vercel/output/config.json` + `.vercel/output/static`; locally it requires `.output/server/index.mjs` + `.output/public`.

## Env mapping (Vercel ↔ Web Zod)

Every public web variable mirrors [`apps/web/src/config/env.schema.ts`](../../apps/web/src/config/env.schema.ts). Keep in sync with [ops/secrets-checklist.md](../ops/secrets-checklist.md).

| Variable       | Staging project (`banal-web-staging`)     | Production project (`banal-web-production`)  | Required | Notes                                      |
| -------------- | ----------------------------------------- | -------------------------------------------- | -------- | ------------------------------------------ |
| `VITE_API_URL` | `https://api-staging-9c27.up.railway.app` | `https://api-production-b6c9.up.railway.app` | yes      | Absolute API origin; embedded in client JS |

**Never** put JWT secrets, `MONGODB_URI`, or other API secrets in Vercel. Vite embeds every `VITE_*` into the browser bundle.

### Railway pairing (required for cookies / CORS)

Set on the **API** Railway service after web URLs exist:

| Variable                   | Staging API                            | Production API (interim until T23)        |
| -------------------------- | -------------------------------------- | ----------------------------------------- |
| `WEB_ORIGIN`               | `https://banal-web-staging.vercel.app` | `https://banal-web-production.vercel.app` |
| `WEB_ORIGIN_PREVIEW_REGEX` | `^https://.*\.vercel\.app$`            | unset                                     |
| `AUTH_COOKIE_SAMESITE`     | `none`                                 | `none` (interim; T23 → `lax`)             |

## Service URLs

| Environment | Vercel project         | Public web origin                         | Recorded   |
| ----------- | ---------------------- | ----------------------------------------- | ---------- |
| Staging     | `banal-web-staging`    | `https://banal-web-staging.vercel.app`    | 2026-07-25 |
| Production  | `banal-web-production` | `https://banal-web-production.vercel.app` | 2026-07-25 |

Team: `platenprimes-projects`. Also in [track-platform-acceptance.md](../track-platform-acceptance.md).

## Smoke

```bash
# Unix / Git Bash
WEB_BASE_URL=https://banal-web-staging.vercel.app node ./scripts/smoke-web.mjs
WEB_BASE_URL=https://banal-web-production.vercel.app node ./scripts/smoke-web.mjs
```

PowerShell:

```powershell
$env:WEB_BASE_URL = "https://banal-web-staging.vercel.app"
node ./scripts/smoke-web.mjs
```

Script checks `GET /` and `GET /login` → 200 + SSR HTML markers.

**Verified 2026-07-25:** both staging and production smoke-web → ok. Cross-site auth on staging: register/login → `me` → logout with `Set-Cookie` flags `HttpOnly; Secure; SameSite=None` against Railway staging API with `Origin: https://banal-web-staging.vercel.app`. CORS preflight `OPTIONS /api/v1/auth/login` → `access-control-allow-credentials: true` and exact origin echo (including preview regex on staging).

## Logs

1. Vercel dashboard → project → **Deployments** → deployment → **Logs** / **Build Logs**.
2. CLI: `vercel logs <deployment-url>` against the linked project.

Runtime is Vercel Functions (Fluid). There is no long-lived Node process on Vercel for the web app.

## Rollback

See [ops/incident-rollback.md](../ops/incident-rollback.md)#vercel-web. Summary: Deployments → Instant Rollback / promote previous known-good → smoke `scripts/smoke-web.mjs`; confirm `VITE_API_URL` unchanged.

**Dry-run note:** Staging Deployments UI lists prior Production deployments after the first successful T22 deploy (2026-07-25). Practice: Instant Rollback or `vercel rollback` on **staging only** → re-run smoke-web.

## Related

- [railway.md](railway.md) — API URLs, `WEB_ORIGIN`, cookie SameSite
- [ops/environments.md](../ops/environments.md) — env matrix + preview CORS
- [ops/secrets-checklist.md](../ops/secrets-checklist.md) — Vercel may only hold `VITE_*`
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T22 Vercel Web
- [incident-rollback.md](../ops/incident-rollback.md)
- [`apps/web/vercel.json`](../../apps/web/vercel.json)
- [`apps/web/vite.config.ts`](../../apps/web/vite.config.ts)
