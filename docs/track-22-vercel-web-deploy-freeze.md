# Track 22 — Vercel Web Deploy freeze checklist

Closes **T22** (steps **206–218**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                  | Status | Evidence                                                                                                                           |
| ---- | ---------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------- |
| 206  | Nitro confirm          | done   | [`apps/web/vite.config.ts`](../apps/web/vite.config.ts) `nitro()`; local `nx run web:build` → `.output`; Vercel → `.vercel/output` |
| 207  | Vercel project doc     | done   | [`deploy/vercel.md`](deploy/vercel.md) copy-pasteable runbook                                                                      |
| 208  | Monorepo install       | done   | Root Directory `apps/web`; Vercel install from monorepo root; build `npm run build`; preset-aware assert gate                      |
| 209  | Framework preset       | done   | `tanstack-start` via `vercel project update` + [`apps/web/vercel.json`](../apps/web/vercel.json)                                   |
| 210  | `VITE_API_URL` staging | done   | Staging project → `https://api-staging-9c27.up.railway.app` (Production/Preview/Development)                                       |
| 211  | CORS WEB_ORIGIN        | done   | Railway staging `WEB_ORIGIN=https://banal-web-staging.vercel.app`; preflight 204 + credentials                                     |
| 212  | Preview SameSite       | done   | `AUTH_COOKIE_SAMESITE=none` + `WEB_ORIGIN_PREVIEW_REGEX`; login Set-Cookie `HttpOnly; Secure; SameSite=None`                       |
| 213  | Production web project | done   | `banal-web-production`; `VITE_API_URL` → prod API; URL `https://banal-web-production.vercel.app`                                   |
| 214  | SSR smoke prod         | done   | `WEB_BASE_URL=… node scripts/smoke-web.mjs` → `/` + `/login` 200 on staging and production                                         |
| 215  | Env sync checklist     | done   | [`ops/secrets-checklist.md`](ops/secrets-checklist.md), [`ops/environments.md`](ops/environments.md) ↔ live URLs                   |
| 216  | Vercel Git integration | done   | Both projects connected to `PlatenPrime/banal`; staging previews on; production Ignored Build Step skips preview                   |
| 217  | Rollback Vercel        | done   | [`ops/incident-rollback.md`](ops/incident-rollback.md)#vercel-web + dry-run note                                                   |
| 218  | T22 freeze             | done   | this file; staging web↔api auth login → me → logout                                                                                |

## Verification

```bash
npx nx run web:build
WEB_BASE_URL=https://banal-web-staging.vercel.app node ./scripts/smoke-web.mjs
WEB_BASE_URL=https://banal-web-production.vercel.app node ./scripts/smoke-web.mjs

# CORS preflight (expect allow-origin echo + credentials)
curl -i -X OPTIONS https://api-staging-9c27.up.railway.app/api/v1/auth/login \
  -H "Origin: https://banal-web-staging.vercel.app" \
  -H "Access-Control-Request-Method: POST"
```

## Related

- Previous: [`track-21-railway-api-deploy-freeze.md`](track-21-railway-api-deploy-freeze.md)
- Next track: **T23 — Custom Domains & Cookie Prod** (219–226)
- Deploy: [`deploy/vercel.md`](deploy/vercel.md), [`deploy/railway.md`](deploy/railway.md)
