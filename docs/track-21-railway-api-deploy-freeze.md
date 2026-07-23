# Track 21 — Railway API Deploy freeze checklist

Closes **T21** (steps **191–205**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                 | Status | Evidence                                                                                                                       |
| ---- | --------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------ |
| 191  | API Dockerfile        | done   | [`apps/api/Dockerfile`](../apps/api/Dockerfile) multi-stage Node 24; local `docker build` + `/health` 200                      |
| 192  | `.dockerignore`       | done   | [`.dockerignore`](../.dockerignore) — small context; keeps workspace `package.json` for web/e2e                                |
| 193  | `railway.toml`        | done   | [`railway.toml`](../railway.toml) at repo root (`healthcheckPath=/health`, timeout 300s, Dockerfile builder)                   |
| 194  | Deploy doc Railway    | done   | [`deploy/railway.md`](deploy/railway.md) copy-pasteable runbook                                                                |
| 195  | Env mapping table     | done   | [`deploy/railway.md`](deploy/railway.md)#env-mapping-railway--api-zod ↔ [`ops/secrets-checklist.md`](ops/secrets-checklist.md) |
| 196  | Staging service       | done   | Railway project `banal` env `staging`; `https://api-staging-9c27.up.railway.app`                                               |
| 197  | Atlas network Railway | done   | Interim: Railway Mongo private network (2026-07-23); Atlas swap path in railway.md + atlas.md                                  |
| 198  | Staging smoke         | done   | `API_BASE_URL=https://api-staging-9c27.up.railway.app node scripts/smoke-api.mjs` → `/health` + `/health/ready` 200            |
| 199  | Production service    | done   | env `production`; `https://api-production-b6c9.up.railway.app`                                                                 |
| 200  | Prod secrets          | done   | JWT ≥32, distinct from staging; checklist in railway.md                                                                        |
| 201  | Graceful shutdown     | done   | `enableShutdownHooks` in `main.ts`; redeploy without crash loop 2026-07-23                                                     |
| 202  | Rollback procedure    | done   | [`ops/incident-rollback.md`](ops/incident-rollback.md)#railway-api + dry-run note                                              |
| 203  | Monorepo build args   | done   | Image copies `libs/shared-contracts/dist`; boot OK on Railway                                                                  |
| 204  | PORT binding          | done   | Zod `PORT` + Railway inject; documented in railway.md                                                                          |
| 205  | T21 freeze            | done   | this file                                                                                                                      |

## Verification

```bash
docker build -f apps/api/Dockerfile -t banal-api .
API_BASE_URL=https://api-staging-9c27.up.railway.app node scripts/smoke-api.mjs
API_BASE_URL=https://api-production-b6c9.up.railway.app node scripts/smoke-api.mjs
```

## Related

- Previous: [`track-20-observability-production-freeze.md`](track-20-observability-production-freeze.md)
- Next track: **T22 — Vercel Web Deploy** (206–218)
- Deploy: [`deploy/railway.md`](deploy/railway.md), [`deploy/atlas.md`](deploy/atlas.md)
