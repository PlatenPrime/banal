# Track 25 — Platform acceptance checklist

Closes **T25 — Runbooks & Freeze** (steps **237–246**). Confirms Tracks **T11–T24** are done and the platform baseline is frozen at `platform-v1.0.0`.

Canonical criteria: [PLATFORM-ROADMAP.md §1 «Платформа готова»](PLATFORM-ROADMAP.md#1-цель-и-границы).

Predecessor: [track-foundation-acceptance.md](track-foundation-acceptance.md) (`foundation-v1.0.0`).

## «Платформа готова»

| Criterion                                    | Status     | Evidence                                                                                                                                                                                                                                                                                             |
| -------------------------------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Staging API on Railway + Web on Vercel       | ⬜ todo    | URLs recorded in this file / [`docs/deploy/README.md`](deploy/README.md) after T21–T22                                                                                                                                                                                                               |
| Prod custom domains + cookies `SameSite=Lax` | ⬜ todo    | T23; login → me → logout on `app.` / `api.`                                                                                                                                                                                                                                                          |
| Atlas only via env; CI without prod URI      | ✅ done    | T12 env matrix + naming; T13 [`deploy/atlas.md`](deploy/atlas.md) connection/network policy; CI `mongo:7` / `app_foundation_ci` ([`ops/environments.md`](ops/environments.md), [`track-13-atlas-network-freeze.md`](track-13-atlas-network-freeze.md))                                               |
| Auth e2e + Playwright login                  | ⬜ todo    | T15–T16, T19; CI green                                                                                                                                                                                                                                                                               |
| Branch protection + Dependabot               | ✅ done    | T11; [`docs/branch-protection.md`](branch-protection.md), [`.github/dependabot.yml`](../.github/dependabot.yml), [`track-11-ops-freeze.md`](track-11-ops-freeze.md)                                                                                                                                  |
| OpenAPI drift + tests-first                  | ⬜ todo    | foundation gates unchanged; auth paths in OpenAPI                                                                                                                                                                                                                                                    |
| Runbooks deploy / rollback / secrets         | 🟡 partial | T12: [`ops/secrets-checklist.md`](ops/secrets-checklist.md), [`deploy/`](deploy/README.md) stubs; full Railway/Vercel runbooks T21–T25; [`ops/incident-rollback.md`](ops/incident-rollback.md)                                                                                                       |
| ADR-002 + ADR-003 accepted                   | ✅ done    | T14; [`docs/adr/002-auth-jwt-cookies.md`](adr/002-auth-jwt-cookies.md), [`docs/adr/003-app-users-collection.md`](adr/003-app-users-collection.md); stub [`004-legacy-users-dual-read.md`](adr/004-legacy-users-dual-read.md); [`track-14-auth-data-adr-freeze.md`](track-14-auth-data-adr-freeze.md) |
| Tag `platform-v1.0.0`                        | ⬜ todo    | [`CHANGELOG.md`](../CHANGELOG.md); remote tag (steps 244–245)                                                                                                                                                                                                                                        |

Fill statuses to ✅ as tracks close. Do not mark this checklist complete until step **246**.

## Tracks (T11–T25)

| Track                 | Steps   | Status |
| --------------------- | ------- | ------ |
| T11 Repo ops          | 097–104 | `done` |
| T12 Env & secrets     | 105–114 | `done` |
| T13 Atlas & network   | 115–122 | `done` |
| T14 Auth data & ADR   | 123–128 | `done` |
| T15 Auth API          | 129–145 | `todo` |
| T16 Auth security     | 146–155 | `done` |
| T17 Auth web          | 156–168 | `done` |
| T18 Feature flags     | 169–174 | `todo` |
| T19 Quality expansion | 175–182 | `todo` |
| T20 Observability     | 183–190 | `todo` |
| T21 Railway API       | 191–205 | `todo` |
| T22 Vercel web        | 206–218 | `todo` |
| T23 Custom domains    | 219–226 | `todo` |
| T24 CI/CD deploy      | 227–236 | `todo` |
| T25 Runbooks & freeze | 237–246 | `todo` |

## Deployed URLs (fill during T21–T23)

| Env        | API                            | Web                            |
| ---------- | ------------------------------ | ------------------------------ |
| Staging    | _TBD_                          | _TBD_                          |
| Production | _TBD_ (`https://api.<domain>`) | _TBD_ (`https://app.<domain>`) |

## Verification commands

```bash
npm run ci
npm run ci:full

# After auth (local):
# nx run api:bootstrap-admin
# curl -c cookies.txt -X POST http://localhost:4000/api/v1/auth/login ...
# curl -b cookies.txt http://localhost:4000/api/v1/auth/me

# After deploy (staging):
curl https://<staging-api>/health
curl https://<staging-api>/health/ready
```

## Anti-goals (must remain out of platform scope)

- OAuth / magic-link / email verification product
- RBAC UI
- Legacy `users` dual-read/write (ADR-004 later)
- Postgres migration
- Microservice split

## Related

- Roadmap: [`PLATFORM-ROADMAP.md`](PLATFORM-ROADMAP.md)
- Foundation: [`FOUNDATION-ROADMAP.md`](FOUNDATION-ROADMAP.md)
- Domain after platform: [`domain-module-recipe.md`](domain-module-recipe.md)
