# Track 10 — Foundation acceptance checklist

Closes **T10 — Acceptance** (steps **093–096**). Confirms Tracks **T0–T9** are done and the platform baseline is frozen at `foundation-v1.0.0`.

Canonical criteria: [FOUNDATION-ROADMAP.md §1 «Фундамент готов»](FOUNDATION-ROADMAP.md#1-цель-и-границы).

## «Фундамент готов»

| Criterion                                                           | Status | Evidence                                                                                                                                               |
| ------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run ci` green locally and in GitHub Actions (ubuntu + windows) | ✅     | [`package.json`](../package.json) `ci`; [`.github/workflows/ci.yml`](../.github/workflows/ci.yml); [`docs/branch-protection.md`](branch-protection.md) |
| API: `/health`, `/health/ready` (Mongo ping), `/api/v1/examples/*`  | ✅     | [`apps/api/src/health/`](../apps/api/src/health/); [`apps/api/src/examples/`](../apps/api/src/examples/); e2e under `apps/api/test/`                   |
| Web: SSR shell, demo route with Query + Form to example API         | ✅     | [`apps/web/`](../apps/web/); `nx run web:build`; routes `/examples`, `/examples/new`                                                                   |
| Shared contracts: health + Problem Details + example DTO            | ✅     | [`libs/shared-contracts/`](../libs/shared-contracts/); Zod unit tests                                                                                  |
| Mongo: MongooseModule, compat pattern, `_foundation_examples`       | ✅     | [`apps/api/src/database/`](../apps/api/src/database/); [`apps/api/src/compat/`](../apps/api/src/compat/); e2e with Mongo service                       |
| Tests-first gate active                                             | ✅     | [`scripts/validate-tests-first.mjs`](../scripts/validate-tests-first.mjs); husky + CI                                                                  |
| Coverage thresholds enabled                                         | ✅     | Vitest v8 per project (T6-072); CI fail on regress                                                                                                     |
| OpenAPI → typed web client without drift                            | ✅     | `openapi:export` / `openapi:generate` / `openapi:check` in `npm run ci`                                                                                |
| ADR «shared Mongo with legacy» accepted                             | ✅     | [`docs/adr/001-shared-mongodb-with-legacy.md`](adr/001-shared-mongodb-with-legacy.md)                                                                  |
| Inventory stub for legacy collections                               | ✅     | [`docs/data/collections-inventory.md`](data/collections-inventory.md)                                                                                  |

## Tracks closed

| Track              | Steps   | Status |
| ------------------ | ------- | ------ |
| T0 Bootstrap       | 001–018 | `done` |
| T1 Local quality   | 019–024 | `done` |
| T2 Contracts       | 025–030 | `done` |
| T3 API platform    | 031–048 | `done` |
| T4 Mongo           | 049–058 | `done` |
| T5 Web             | 059–068 | `done` |
| T6 Testing         | 069–076 | `done` |
| T7 CI/CD           | 077–084 | `done` |
| T8 Contract bridge | 085–088 | `done` |
| T9 Observability   | 089–092 | `done` |
| T10 Acceptance     | 093–096 | `done` |

## Verification commands

```bash
npm run ci
# With local/CI Mongo:
npm run ci:full
```

Smoke (API up + Mongo):

```bash
curl http://localhost:4000/health
curl http://localhost:4000/health/ready
curl http://localhost:4000/api/v1/examples
```

## Related

- Domain onboarding after foundation: [`docs/domain-module-recipe.md`](domain-module-recipe.md)
- Roadmap progress: [`docs/FOUNDATION-ROADMAP.md`](FOUNDATION-ROADMAP.md)
- Changelog baseline: [`CHANGELOG.md`](../CHANGELOG.md)
