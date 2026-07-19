# banal

Nx monorepo foundation: NestJS API (`apps/api`), TanStack Start web (`apps/web`), and shared Zod contracts (`libs/shared-contracts`). Local MongoDB via Docker; shared-DB strangler with legacy is planned after Track 10.

Roadmap (source of truth): [docs/FOUNDATION-ROADMAP.md](docs/FOUNDATION-ROADMAP.md). Detailed toolchain notes: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

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

Stop Mongo:

```bash
docker compose down
```

Local Mongo URI (no auth, dev only):

```text
mongodb://127.0.0.1:27017/app_foundation_dev
```

## Quality scripts

```bash
npm run build
npm run test
npm run lint
npm run typecheck
npm run format:check
npm run ci
```

### `npm run ci` (local mirror)

Runs the same quality order as the planned GitHub Actions job (Track 7):

1. `validate-tests-first --ci`
2. `format:check`
3. `lint` → `typecheck` → `build` → `test` (all projects via `nx run-many`)

**Parity vs future GHA (T7):** local `ci` uses `run-many` on every project. CI will switch to `nx affected` with `NX_BASE`/`NX_HEAD`, add `test:e2e` (Mongo service), and restore Nx cache. Until then, local `npm run ci` is the full green check.

**pre-commit:** lint-staged (prettier + eslint) → tests-first on staged → unit tests for touched projects. **pre-push:** `node scripts/husky-pre-push.mjs` (typecheck).

## Layout

```text
apps/api                 NestJS API
apps/web                 TanStack Start
libs/shared-contracts    Shared Zod + types (@app/shared-contracts)
docs/                    Setup + foundation roadmap
```

Do not write to legacy Mongo collections until Track 10 is closed.
