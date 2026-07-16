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

## Next steps (after bootstrap)

When apps exist:

```bash
npm run build
npm run test
npm run lint
npm run typecheck
```

Mongo (when `docker-compose.yml` is added):

```bash
docker compose up -d mongo
```

See [FOUNDATION-ROADMAP.md](./FOUNDATION-ROADMAP.md) for verification commands per step.
