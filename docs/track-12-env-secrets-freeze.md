# Track 12 — Environments & Secrets freeze checklist

Closes **T12** (steps **105–114**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                   | Status | Evidence                                                                                                         |
| ---- | ----------------------- | ------ | ---------------------------------------------------------------------------------------------------------------- |
| 105  | Env matrix doc          | done   | [`ops/environments.md`](ops/environments.md)                                                                     |
| 106  | API env Zod expand      | done   | [`apps/api/src/config/env.schema.ts`](../apps/api/src/config/env.schema.ts) + `env.schema.spec.ts`               |
| 107  | Web env policy          | done   | [`LOCAL_SETUP.md`](LOCAL_SETUP.md)#secrets-never-in-vite; web `env.schema.spec.ts`                               |
| 108  | `.env.example` sync     | done   | root + [`apps/api/.env.example`](../apps/api/.env.example) + [`apps/web/.env.example`](../apps/web/.env.example) |
| 109  | Secrets checklist       | done   | [`ops/secrets-checklist.md`](ops/secrets-checklist.md)                                                           |
| 110  | Atlas DB naming         | done   | [`ops/environments.md`](ops/environments.md)#atlas-db-naming                                                     |
| 111  | Preview origins         | done   | [`cors.options.ts`](../apps/api/src/cors.options.ts) + `cors.options.spec.ts`                                    |
| 112  | TRUST_PROXY doc         | done   | [`LOCAL_SETUP.md`](LOCAL_SETUP.md)#trust_proxy; [`deploy/railway.md`](deploy/railway.md)                         |
| 113  | Secret rotation runbook | done   | [`ops/secrets-checklist.md`](ops/secrets-checklist.md)#jwt-secret-rotation                                       |
| 114  | T12 checklist           | done   | this file                                                                                                        |

## Verification

```bash
npx nx run api:test
npx nx run web:test
# Review: docs/ops/environments.md, docs/ops/secrets-checklist.md, .env.example files
```

## Related

- Platform acceptance: [`track-platform-acceptance.md`](track-platform-acceptance.md)
- Previous: [`track-11-ops-freeze.md`](track-11-ops-freeze.md)
- Next track: **T13 — Atlas & Network** (115–122) — closed: [`track-13-atlas-network-freeze.md`](track-13-atlas-network-freeze.md)
