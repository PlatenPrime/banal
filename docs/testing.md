# Testing guide

Team norms for Vitest in this monorepo. Policy source: [FOUNDATION-ROADMAP.md §5](./FOUNDATION-ROADMAP.md#5-политики-качества-не-опционально). Local toolchain: [LOCAL_SETUP.md](./LOCAL_SETUP.md).

## Layers

| Layer      | Location                                        | Runner / config                                                                                    | Dependencies                                                                  |
| ---------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Unit API   | `apps/api/src/**/*.{spec,test}.ts`              | `nx run api:test` → [`apps/api/vitest.config.ts`](../apps/api/vitest.config.ts)                    | mocks; node; pool `forks`; no DB                                              |
| E2E API    | `apps/api/test/**/*.e2e-spec.ts`                | `nx run api:test:e2e` → [`apps/api/vitest.e2e.config.ts`](../apps/api/vitest.e2e.config.ts)        | Nest TestingModule + supertest + Mongo; sequential (`fileParallelism: false`) |
| Unit web   | `apps/web/src/**/*.{test,spec}.{ts,tsx}`        | `nx run web:test` → [`apps/web/vitest.config.ts`](../apps/web/vitest.config.ts)                    | happy-dom; Testing Library; mock fetch                                        |
| Smoke web  | rebuild assert                                  | `nx run web:test:smoke` → [`apps/web/vitest.smoke.config.ts`](../apps/web/vitest.smoke.config.ts)  | production SSR build output                                                   |
| Playwright | `apps/web-e2e/src/**/*.spec.ts`                 | `nx run web-e2e:e2e` → [`apps/web-e2e/playwright.config.ts`](../apps/web-e2e/playwright.config.ts) | Chromium; running web + API + Mongo                                           |
| Contracts  | `libs/shared-contracts/src/**/*.{spec,test}.ts` | `nx run shared-contracts:test`                                                                     | Zod parse + golden fixtures under `src/fixtures/`                             |
| Scripts    | `scripts/*.spec.mjs`                            | `npm run test:scripts`                                                                             | Node built-in test runner (gate self-tests)                                   |

Optional integration specs (`*.integration.spec.ts`) may use Mongo memory / test containers later; they are not required for foundation DoD.

**Do not mix layers:** unit configs exclude `*.e2e-spec.ts`; e2e is a separate Nx target. E2E / Playwright alone never satisfy the tests-first gate for production source diffs.

## Commands

From the repository root:

```bash
npm run test                 # all unit targets (nx run-many -t test)
npm run test:api             # api unit + coverage → apps/api/coverage/
npm run test:web             # web unit + coverage → apps/web/coverage/
npm run test:contracts       # shared-contracts + coverage
npm run test:api:e2e         # api e2e (needs MONGODB_URI / local compose)
npm run test:web:e2e         # Playwright (needs Mongo + api + web running)
npm run test:web:smoke       # web SSR build smoke
npm run test:scripts         # validate-tests-first / staged-runner self-tests
npm run validate:tests-first # gate in --ci mode
npm run ci                   # full local quality mirror (run-many)
npm run ci:full              # ci + api e2e + Playwright (needs Mongo + stack)
```

Per-project: `npx nx run <project>:test` (and `api:test:e2e`, `web:test:smoke`, `web-e2e:e2e` where defined).

## Tests-first gate

Script: [`scripts/validate-tests-first.mjs`](../scripts/validate-tests-first.mjs).

| Change                              | Same commit / PR must include                    |
| ----------------------------------- | ------------------------------------------------ |
| `apps/api/src/**` (not a test file) | ≥1 `apps/api/**/*.{spec,test}.ts`                |
| `apps/web/src/**` (not a test file) | ≥1 `apps/web/**/*.{test,spec}.{ts,tsx}`          |
| `libs/shared-contracts/src/**`      | unit spec for schemas/types                      |
| Only `apps/api/test/*.e2e-spec.ts`  | **does not** close the gate for production diffs |
| Only `apps/web-e2e/**`              | **does not** close the gate for production diffs |

- **pre-commit:** staged files (via husky → `validate-tests-first.mjs`)
- **local / CI:** `npm run validate:tests-first` (`--ci`, after `NX_BASE` / GitHub range when available)

**No bypass:** `--no-verify` skips husky only. It must not be used to land production changes without co-committed unit tests. `npm run ci` and GitHub Actions always run the gate first (fail-closed, no `continue-on-error`).

## Coverage

Provider: `@vitest/coverage-v8`, **per-project** reports under each package’s `coverage/` (gitignored). Thresholds apply on the unit `test` target’s scoped `include` paths.

| Project            | Scoped include (summary)                                                                 | Lines | Branches | Functions |
| ------------------ | ---------------------------------------------------------------------------------------- | ----- | -------- | --------- |
| `shared-contracts` | `src/**/*.ts` (excl. specs)                                                              | ≥90%  | ≥85%     | ≥90%      |
| `api`              | examples service/repo, `compat/mappers`, `auth/**`, `users/**` (excl. Nest wiring / CLI) | ≥80%  | ≥75%     | ≥80%      |
| `web`              | `lib/api-client/**`, `lib/query-client.ts`, `lib/auth/**`                                | ≥75%  | ≥70%     | ≥75%      |

**Rule:** thresholds only increase. A regression fails CI / local `test`.

API coverage `exclude` for Nest wiring (still covered by API e2e): `*.module.ts`, `*.controller.ts`, `*.dto.ts`, `*.decorator.ts`, `bootstrap-admin.cli.ts`.

### Platform modules (expand include)

Foundation coverage is intentionally **scoped**. When platform work lands new production surfaces, **expand** each project's Vitest coverage `include` to cover those paths and keep or raise thresholds — never shrink them. Auth/users and web `lib/auth` were expanded in Track **T19** (steps 175–176).

## Playwright (web e2e)

Project: [`apps/web-e2e`](../apps/web-e2e). Specs: smoke + login (`bootstrap-admin` → `/login` → protected `/examples/new`).

### Local

```bash
docker compose up -d
# apps/api/.env and apps/web/.env as in LOCAL_SETUP.md
npx nx serve api
# other terminal — create e2e user (once per DB):
# BOOTSTRAP_ADMIN_EMAIL=e2e-admin@example.com \
# BOOTSTRAP_ADMIN_USERNAME=e2e-admin \
# BOOTSTRAP_ADMIN_PASSWORD=e2e-admin-password1 \
# npx nx run api:bootstrap-admin
npx nx serve web
npx playwright install chromium   # once
npm run test:web:e2e
```

Defaults match CI bootstrap credentials (`e2e-admin` / `e2e-admin-password1`) unless you override `BOOTSTRAP_ADMIN_*`.

Use the same host for web and `WEB_ORIGIN` / `VITE_API_URL` (prefer `localhost` everywhere) so cookies and CORS stay aligned.

### CI

GitHub Actions job **`playwright`** (ubuntu-only, `mongo:7`): builds api+web, starts both, bootstraps admin, runs Chromium. Required for merges into `main` — see [branch-protection.md](./branch-protection.md).

## Where files live

| Kind                       | Path pattern                                                             |
| -------------------------- | ------------------------------------------------------------------------ |
| Unit (colocate)            | next to production code (`*.spec.ts` / `*.test.tsx`)                     |
| API e2e                    | `apps/api/test/*.e2e-spec.ts`                                            |
| Playwright                 | `apps/web-e2e/src/*.spec.ts`                                             |
| Mongo e2e isolation        | `apps/api/test/helpers/mongo-test-uri.ts` → unique `vitest_*` DB per run |
| Legacy fixtures            | `apps/api/test/fixtures/`                                                |
| Contract golden fixtures   | `libs/shared-contracts/src/fixtures/`                                    |
| Gate / staged-runner specs | `scripts/*.spec.mjs`                                                     |

## Definition of Done (PR)

1. Production change + unit tests in the **same** changeset.
2. `nx affected -t lint,typecheck,build,test` (or full `npm run ci`) green.
3. HTTP / API behavior change → extend or add e2e under `apps/api/test/`.
4. Auth web↔api login flow change → extend Playwright under `apps/web-e2e/`.
5. New env vars → update `.env.example`.
6. Roadmap step marked `done` when closing a foundation/platform step.

## Related

- [LOCAL_SETUP.md](./LOCAL_SETUP.md) — install, hooks, Mongo, local ↔ GHA parity
- [branch-protection.md](./branch-protection.md) — required Actions checks for `main`
- [FOUNDATION-ROADMAP.md](./FOUNDATION-ROADMAP.md) — Track 6 (069–076), Track 7 CI/CD (077–084)
- [PLATFORM-ROADMAP.md](./PLATFORM-ROADMAP.md) — Track 19 Quality Expansion
- Vitest configs: `apps/api/vitest.config.ts`, `apps/api/vitest.e2e.config.ts`, `apps/web/vitest.config.ts`, `apps/web/vitest.smoke.config.ts`, `libs/shared-contracts/vitest.config.ts`
- Playwright: `apps/web-e2e/playwright.config.ts`
