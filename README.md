# banal

Nx monorepo foundation: NestJS API (`apps/api`), TanStack Start web (`apps/web`), and shared Zod contracts (`libs/shared-contracts`). Local MongoDB via Docker; shared-DB strangler with legacy is planned after Track 10.

Roadmap (source of truth): [docs/FOUNDATION-ROADMAP.md](docs/FOUNDATION-ROADMAP.md). Detailed toolchain notes: [docs/LOCAL_SETUP.md](docs/LOCAL_SETUP.md).

## Requirements

| Tool    | Version              |
| ------- | -------------------- |
| Node.js | 24.x (see `.nvmrc`)  |
| npm     | 10.x or newer        |
| Docker  | Latest stable        |
| Git     | 2.x                  |

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
```

A unified `npm run ci` lands in Track 1 (step 023).

## Layout

```text
apps/api                 NestJS API
apps/web                 TanStack Start
libs/shared-contracts    Shared Zod + types (@app/shared-contracts)
docs/                    Setup + foundation roadmap
```

Do not write to legacy Mongo collections until Track 10 is closed.
