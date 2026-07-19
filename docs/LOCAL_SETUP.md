# Local setup

Runbook for developing the **banal** monorepo. Full foundation scope is defined in [FOUNDATION-ROADMAP.md](./FOUNDATION-ROADMAP.md).

## Requirements

| Tool    | Version                                         |
| ------- | ----------------------------------------------- |
| Node.js | 24.x (see `.nvmrc`)                             |
| npm     | 10.x or newer                                   |
| Docker  | Latest stable (MongoDB local stack — step 016+) |
| Git     | 2.x                                             |

## Node version

Use the version pinned in the repo root:

```bash
# nvm
nvm use

# fnm
fnm use
```

Verify:

```bash
node -v   # v24.x.x
npm -v    # 10.x or newer
```

## Install dependencies

From the repository root:

```bash
npm install
```

`prepare` runs `husky` + a Windows-safe runner patch, which wires git hooks under `.husky/`. After install:

- **pre-commit** → `node scripts/husky-pre-commit.mjs`
  1. `lint-staged` (prettier + eslint on staged files)
  2. `node scripts/validate-tests-first.mjs`
  3. `node scripts/run-staged-tests.mjs` (unit tests for touched Nx projects)
- **pre-push** → `node scripts/husky-pre-push.mjs` (`npm run typecheck`)

### Windows: `execvpe(/bin/bash)` / husky pre-push failed

If push fails with WSL `CreateProcessCommon ... /bin/bash` and only `docker-desktop` is installed as a WSL distro, Windows `bash.exe` is broken for husky.

**Fix (pick one):**

1. Prefer **Git for Windows** (`C:\Program Files\Git\cmd\git.exe`) for Cursor/VS Code (`git.path`), then re-run `npm install` (applies `scripts/patch-husky-runner.mjs`).
2. Install a real distro and make it default: `wsl --install -d Ubuntu` then `wsl --set-default Ubuntu`.
3. Or disable the Windows “App execution aliases” for `bash.exe` so Git’s `bash` is used instead of the WSL stub.

## npm scope

Shared libraries use the **`@app/*`** scope (for example `@app/shared-contracts`). Path aliases are configured in `tsconfig.base.json` (step 006).

## Foundation tracks (order)

Follow the recommended flow in the roadmap:

1. **Track 0** — workspace bootstrap (001–018)
2. **Track 1** — local quality gates (019–024)
3. **Track 2–3** — shared contracts + API platform
4. **Track 4–5** — Mongo skeleton + web platform
5. **Track 6–10** — testing, CI/CD, contract bridge, observability, acceptance

Do not touch legacy MongoDB collections until **Track 10** is complete.

## Quality / CI locally

```bash
npm run build
npm run test
npm run lint
npm run typecheck
npm run format:check
npm run ci
```

`npm run ci` mirrors the planned GHA order: tests-first (`--ci`) → format → lint → typecheck → build → test. Track 7 will add `nx affected`, e2e + Mongo, and cache; until then local `ci` runs all projects via `run-many`.

## MongoDB (local)

From the repository root:

```bash
docker compose up -d
docker compose ps          # STATUS should be healthy
```

Connection (no auth, for local/dev only):

```text
mongodb://127.0.0.1:27017/app_foundation_dev
```

Stop:

```bash
docker compose down
```

See [FOUNDATION-ROADMAP.md](./FOUNDATION-ROADMAP.md) for verification commands per step.
