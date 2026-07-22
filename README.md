# banal

Nx monorepo foundation: NestJS API (`apps/api`), TanStack Start web (`apps/web`), and shared Zod contracts (`libs/shared-contracts`). Local MongoDB via Docker; shared-DB strangler with legacy is planned after Track 10.

Roadmap (source of truth): [docs/FOUNDATION-ROADMAP.md](docs/FOUNDATION-ROADMAP.md). Detailed toolchain notes: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md). Testing norms: [docs/testing.md](docs/testing.md). Branch protection: [docs/branch-protection.md](docs/branch-protection.md).

## Requirements

| Tool    | Version             |
| ------- | ------------------- |
| Node.js | 24.x (see `.nvmrc`) |
| npm     | 10.x or newer       |
| Docker  | Latest stable       |
| Git     | 2.x                 |

## Quick start

```bash
nvm use   # or fnm use
npm install

docker compose up -d
docker compose ps   # STATUS should be healthy

cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# optional: cp .env.example .env
```

Run apps (from repo root):

```bash
npx nx serve api    # http://localhost:4000
npx nx serve web    # http://localhost:3000 (Vite default)
```

**Web ↔ API:** web uses absolute `VITE_API_URL=http://localhost:4000`; API allows the web origin via `WEB_ORIGIN=http://localhost:3000` (CORS). No Vite proxy — SSR and the browser share the same base URL. Details and a manual checklist: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md#web--api-local).

Stop Mongo:

```bash
docker compose down
```

Local Mongo URI (no auth, dev only):

```text
mongodb://127.0.0.1:27017/app_foundation_dev
```

## Quality scripts

Layers, coverage thresholds, and tests-first rules: [docs/testing.md](docs/testing.md).

```bash
npm run build
npm run test
npm run test:web          # web unit + coverage → apps/web/coverage/
npm run test:api          # api unit + coverage → apps/api/coverage/
npm run test:contracts    # shared-contracts + coverage
npm run test:api:e2e
npm run test:web:smoke
npm run test:scripts      # tests-first gate self-tests
npm run validate:tests-first
npm run lint
npm run typecheck
npm run format:check
npm run openapi:export
npm run openapi:generate
npm run openapi:check     # regen + fail on drift
npm run ci
npm run ci:full           # ci + api e2e (needs Docker Mongo)
```

### `npm run ci` (local mirror)

Same gate **order** as the GitHub Actions `quality` job ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)):

1. `validate:tests-first` (`--ci` mode) — **fail-closed, no bypass**
2. `format:check`
3. `lint` → `typecheck` → `build` → `test` (all projects via `nx run-many`)
4. `test:scripts` (gate self-tests)
5. `openapi:check` (export + generate + fail on drift)

**Parity vs GHA:** local `ci` uses `run-many` (full tree). Actions uses `nx affected` (`NX_BASE`/`NX_HEAD`), OS matrix (ubuntu + windows), Nx cache restore, and a separate ubuntu `e2e` job with `mongo:7`. Full table: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md#local-vs-github-actions-parity). Required checks: [docs/branch-protection.md](docs/branch-protection.md).

**OpenAPI:** change API Swagger/DTO surface → `npm run openapi:export` && `npm run openapi:generate` → commit artifacts under `apps/api/openapi/` and `apps/web/src/lib/api/generated/`.

**No bypass:** `--no-verify` only skips local husky hooks; it does not skip `npm run ci` / GHA. Production diffs without a co-committed unit test must fail the gate.

**pre-commit:** lint-staged (prettier + eslint) → tests-first on staged → unit tests for touched projects. **pre-push:** `node scripts/husky-pre-push.mjs` (typecheck).

## Layout

```text
apps/api                 NestJS API
apps/web                 TanStack Start
libs/shared-contracts    Shared Zod + types (@app/shared-contracts)
docs/                    Setup, testing, branch protection, foundation roadmap
```

Do not write to legacy Mongo collections until Track 10 is closed.
