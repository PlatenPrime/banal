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

Line endings are **LF** (`.editorconfig`, `.gitattributes` `eol=lf`, Prettier `endOfLine: lf`). Required for `format:check` on Windows CI runners.

## Install dependencies

From the repository root:

```bash
npm install
```

`prepare` runs `husky` + a Windows-safe runner patch, which wires git hooks under `.husky/`. After install:

- **pre-commit** → `node scripts/husky-pre-commit.mjs`
  1. `lint-staged` (prettier + eslint on staged files)
  2. `node scripts/validate-tests-first.mjs`
  3. `node scripts/run-staged-tests.mjs` — **Nx affected** unit tests (`nx affected -t test --files=…`) for staged workspace graph files (`apps/`, `libs/`, plus root `package.json` / `nx.json` / `tsconfig.base.json`). Docs/scripts-only commits skip. Typical budget **<1 min** (Nx cache helps).
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

Team testing guide (layers, coverage, gates, DoD): [testing.md](./testing.md).

```bash
npm run build
npm run test
npm run test:web          # unit + coverage → apps/web/coverage/
npm run test:api          # unit + coverage → apps/api/coverage/
npm run test:contracts
npm run test:api:e2e
npm run test:web:smoke
npm run test:scripts      # tests-first gate self-tests (node:test)
npm run validate:tests-first
npm run lint
npm run typecheck
npm run format:check
npm run ci                # quality gates (all projects via run-many)
npm run ci:full           # ci + api e2e (needs local Mongo)
```

`npm run ci`: **`validate:tests-first` first** (fail-closed, no skip / `continue-on-error`) → format → lint → typecheck → build → test → `test:scripts`. Uses `nx run-many` on every project so a laptop run is a full green check without needing `NX_BASE`/`NX_HEAD`.

**No bypass:** CI always runs `npm run validate:tests-first` before lint. Local `--no-verify` skips husky only and must never be used to land production changes without unit tests; it does not apply to `npm run ci` or GitHub Actions.

### Local vs GitHub Actions parity

Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml). Branch protection checklist: [branch-protection.md](./branch-protection.md).

| Concern                                  | Local (`npm run ci` / `ci:full`) | GitHub Actions                                                                           |
| ---------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------- |
| OS                                       | your machine                     | matrix: `ubuntu-latest` + `windows-latest` (quality)                                     |
| Node                                     | `.nvmrc` via nvm/fnm             | `setup-node` `node-version-file: .nvmrc` + npm cache                                     |
| Nx task scope                            | `run-many` (all projects)        | `nx affected` via `nrwl/nx-set-shas` (fail-safe → `run-many` if no prior successful run) |
| Nx cache                                 | local `.nx/cache`                | `actions/cache` on `.nx/cache`                                                           |
| tests-first                              | yes (`--ci`)                     | yes (first quality step)                                                                 |
| format / lint / typecheck / build / unit | yes                              | yes (quality job)                                                                        |
| `test:scripts`                           | yes                              | yes (quality job)                                                                        |
| API e2e + Mongo                          | `npm run ci:full` (compose)      | separate `e2e` job, `services: mongo:7` (ubuntu only)                                    |

Use `npm run ci` before push for the same gate order as GHA quality (minus matrix/affected). Use `npm run ci:full` when you changed API HTTP/Mongo behavior.

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

## Web ↔ API (local)

Browser and SSR both call the Nest API with an **absolute** `VITE_API_URL`. Cross-origin browser requests rely on Nest CORS (`WEB_ORIGIN`), not a Vite proxy.

| App | Port   | Env file                                              | Key vars                             |
| --- | ------ | ----------------------------------------------------- | ------------------------------------ |
| API | `4000` | `apps/api/.env`                                       | `WEB_ORIGIN=http://localhost:3000`   |
| Web | `3000` | `apps/web/.env` (+ tracked `.env.test` for Vitest/CI) | `VITE_API_URL=http://localhost:4000` |

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

npx nx serve api    # http://localhost:4000
npx nx serve web    # http://localhost:3000
```

### Manual check

1. Open `http://localhost:3000/examples` — list loads from the API (empty or seeded).
2. Browser DevTools → Network: requests go to `http://localhost:4000/...` with `Origin: http://localhost:3000`.
3. Preflight `OPTIONS` succeeds when `WEB_ORIGIN` matches the web origin exactly.

### Why no Vite proxy

A `server.proxy` would only rewrite **browser** same-origin calls. SSR loaders and the shared fetch client already use absolute `VITE_API_URL`, so a proxy would split SSR vs CSR base URLs. Keep CORS + absolute API URL for both.

### Production build smoke

```bash
npx nx run web:build        # vite build + asserts .output/server/index.mjs
npx nx run web:test:smoke   # full rebuild via vitest.smoke.config.ts
```

`apps/web/src/routeTree.gen.ts` is **committed** (not gitignored) so `web:typecheck` works on a fresh clone / CI without running Vite first. Vite/dev still regenerates it; leave the file out of prettier/eslint autofix.

See [FOUNDATION-ROADMAP.md](./FOUNDATION-ROADMAP.md) for verification commands per step.
