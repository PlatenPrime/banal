# Track 24 — CI/CD Deploy Automation freeze checklist

Closes **T24** (steps **227–236**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                               | Status | Evidence                                                                                                                                                      |
| ---- | ----------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 227  | Deploy strategy doc                 | done   | [`deploy/README.md`](deploy/README.md)#deploy-automation-t24 — Vercel Git + Railway GitHub; Actions smoke only                                                |
| 228  | GitHub Environment staging          | done\* | Checklist in deploy README; vars `API_BASE_URL` / `WEB_BASE_URL`; **live create gated** until owner sets Settings → Environments                              |
| 229  | GitHub Environment production       | done\* | Same + **Required reviewers**; interim prod URLs; **live create gated**                                                                                       |
| 230  | Post-deploy smoke workflow          | done   | [`.github/workflows/deploy-smoke.yml`](../.github/workflows/deploy-smoke.yml) — `workflow_dispatch` + push→staging; uses `scripts/smoke-*.mjs`                |
| 231  | Optional Playwright against staging | done   | Documented in [`deploy/README.md`](deploy/README.md)#optional-playwright-against-staging + [`testing.md`](testing.md)#optional-playwright-against-staging-t24 |
| 232  | Railway watch branch                | done\* | [`railway.md`](deploy/railway.md)#watch--promote-t24 — `main`→staging auto; prod manual; **dashboard verify gated**                                           |
| 233  | Vercel prod branch                  | done\* | [`vercel.md`](deploy/vercel.md)#git--production-branch-t24 — Production Branch `main` both projects; **dashboard verify gated**                               |
| 234  | No prod secrets in Actions logs     | done   | [`ops/secrets-checklist.md`](ops/secrets-checklist.md)#no-prod-secrets-in-actions-logs                                                                        |
| 235  | Deploy permissions                  | done   | [`ops/secrets-checklist.md`](ops/secrets-checklist.md)#deploy-permissions-least-privilege — `contents: read`; no Railway/Vercel tokens in Actions             |
| 236  | T24 freeze                          | done\* | this file; full automation path green after owner Environments + one staging smoke run                                                                        |

\*Docs and workflow complete 2026-07-25. Live GitHub Environments (`staging` / `production`), Railway/Vercel branch UI confirmation, and Actions Deploy smoke green are **owner gates** (same pattern as T23 DNS).

## Owner gates (fill when done)

| Gate                                           | Done | Notes                                                                                                                                                      |
| ---------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GH Environment `staging` + vars                | ☑    | Owner confirmed 2026-07-25 (Settings → Environments)                                                                                                       |
| GH Environment `production` + reviewers + vars | ☑    | Owner confirmed 2026-07-25                                                                                                                                 |
| Railway: staging auto `main`; prod manual      | ☑    | Owner 2026-07-25: staging `api` → `PlatenPrime/banal` / `main`, **Auto deploys when pushed** ON, Wait for CI OFF. Prod: auto unavailable / manual Redeploy |
| Vercel: both projects Production Branch `main` | ☑    | Owner confirmed 2026-07-25: `banal-web-staging` + `banal-web-production` → Production Branch **`main`**                                                    |
| Actions → Deploy smoke → `staging` green       | ☐    | Merge T24 to `main`, then Actions → Deploy smoke → environment `staging`                                                                                   |

## Verification (when gates clear)

```bash
# Local equivalent of the workflow
API_BASE_URL=https://api-staging-9c27.up.railway.app node ./scripts/smoke-api.mjs
WEB_BASE_URL=https://banal-web-staging.vercel.app node ./scripts/smoke-web.mjs
```

Then: GitHub Actions → **Deploy smoke** → Run workflow → environment `staging` → green.

Optional: same for `production` (Approve deployment).

## Related

- Previous: [`track-23-custom-domains-freeze.md`](track-23-custom-domains-freeze.md)
- Next track: **T25 — Runbooks & Freeze** (237–246)
- Deploy: [`deploy/README.md`](deploy/README.md)#deploy-automation-t24
- Secrets: [`ops/secrets-checklist.md`](ops/secrets-checklist.md)#github-environments-t24
- Workflow: [`.github/workflows/deploy-smoke.yml`](../.github/workflows/deploy-smoke.yml)
