# Feature flags

Env-only feature flags for the banal API (Track 18). **No** LaunchDarkly, Unleash, or other remote flag vendors — toggles are process environment variables, fail-closed by default, and read at process start (restart to apply).

Implementation: [`apps/api/src/flags/`](../../apps/api/src/flags/) (`FlagsModule` / `FlagsService`). Known booleans also live in Zod [`env.schema.ts`](../../apps/api/src/config/env.schema.ts). Wildcard legacy-write keys are parsed outside the fixed schema.

Environment matrix: [environments.md](environments.md). Secrets placement: [secrets-checklist.md](secrets-checklist.md).

## Philosophy

| Rule                        | Detail                                                                 |
| --------------------------- | ---------------------------------------------------------------------- |
| Env-only                    | Flags are strings in Railway / local `.env` — not a SaaS dashboard     |
| Fail closed                 | Defaults are `false` (registration off; legacy writes off)             |
| Restart to flip             | Nest reads env at boot; change env → redeploy / restart API            |
| No client secrets as flags  | Web never gets write/legacy kill-switches; only API enforces them      |
| ADR gates for legacy writes | Enabling `ALLOW_LEGACY_WRITE_*` still requires ADR + inventory (below) |

## Flag catalog

| Flag / pattern                    | Default          | Effect                                                                     | Typical envs                                      |
| --------------------------------- | ---------------- | -------------------------------------------------------------------------- | ------------------------------------------------- |
| `AUTH_REGISTRATION_ENABLED`       | `false`          | When `false`, `POST /api/v1/auth/register` returns **403**                 | local may be `true`; staging/prod usually `false` |
| `ALLOW_LEGACY_WRITE_<COLLECTION>` | `false` (absent) | Stub: `FlagsService.isLegacyWriteAllowed(collection)` — **no writers yet** | never `true` until ADR + inventory                |

Truthy values (same spirit as Zod `booleanFromEnv`): `true`, `1`, `TRUE`. Everything else (including missing) is treated as off.

## `AUTH_REGISTRATION_ENABLED`

- Enforced in `AuthService.register` via `FlagsService.isRegistrationEnabled()` (not duplicated in the controller).
- Bootstrap first admin with `nx run api:bootstrap-admin` — CLI **bypasses** this flag (see [LOCAL_SETUP.md](../LOCAL_SETUP.md)).
- Production should stay `false` until open registration is an explicit product decision.

## `ALLOW_LEGACY_WRITE_*` (stub)

Pattern: `ALLOW_LEGACY_WRITE_<COLLECTION>` where `<COLLECTION>` is the Mongo collection name (case-insensitive; stored lowercased).

Examples (do **not** enable in real envs without the gates below):

```env
# ALLOW_LEGACY_WRITE_users=false
# ALLOW_LEGACY_WRITE_products=false
```

Before any API code writes to a legacy collection:

1. Dedicated ADR naming the collection and write contract ([ADR-001](../adr/001-shared-mongodb-with-legacy.md)).
2. Inventory mode → `read/write` (or dual-write) in [collections-inventory.md](../data/collections-inventory.md).
3. Feature flag default remains `false`; enable only in controlled environments.
4. Follow [domain-module-recipe.md](../domain-module-recipe.md).

Until writers exist, the parser and `isLegacyWriteAllowed` exist so future repositories have a single kill-switch API.

## How to toggle

### Local

1. Edit `apps/api/.env` (from [`.env.example`](../../apps/api/.env.example)).
2. Restart the API (`nx serve api` or your usual process).

### Railway (staging / production)

1. Set the variable on the API service (staging and prod are separate).
2. Redeploy / restart so the Nest process picks up the new env.
3. Prefer keeping registration and legacy writes **off** in production unless deliberately opened.

## Related

- [environments.md](environments.md) — env matrix and key variables
- [secrets-checklist.md](secrets-checklist.md) — where vars live
- [ADR-001](../adr/001-shared-mongodb-with-legacy.md) — shared Mongo + write gates
- [domain-module-recipe.md](../domain-module-recipe.md) — first legacy module checklist
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — Track 18
