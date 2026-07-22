# Collections inventory (legacy MongoDB)

| Collection             | Writers      | Readers                   | Key fields                                             | Indexes (note)                            | New app mode            |
| ---------------------- | ------------ | ------------------------- | ------------------------------------------------------ | ----------------------------------------- | ----------------------- |
| `_foundation_examples` | new API only | new API                   | `_id`, `name`, `description?`, `createdAt`             | `_id` default                             | read/write              |
| `a_users`              | new API only | new API                   | `_id`, `email`, `username`, `passwordHash`, timestamps | unique `email`, unique `username`         | read/write              |
| `a_refresh_tokens`     | new API only | new API                   | `_id`, `jti` (hash), `userId`, `expiresAt`             | unique `jti`; optional TTL on `expiresAt` | read/write              |
| `users`                | legacy       | legacy; new TBD (ADR-004) | … (legacy shape)                                       | legacy-managed                            | read-only until ADR-004 |

## Rules

- No index/createCollection from new app until row approved in this inventory.
- Schema changes: additive only unless ADR says otherwise.
- **Index policy:**
  - **Legacy** collections: do not create, drop, or modify indexes without an ADR.
  - **App-owned** `_foundation_*` and `a_*` collections: the new app may manage indexes **after** the inventory row is approved (schemas land in T14–T15).
- Planned indexes for auth collections (enforce in Mongoose schemas later):
  - `a_users`: **unique** on `email`; **unique** on `username`
  - `a_refresh_tokens`: **unique** on `jti` (store hash of JWT id, not raw token); optional **TTL** index on `expiresAt`

## `_foundation_examples` (foundation demo)

| Field         | Type     | Notes                                      |
| ------------- | -------- | ------------------------------------------ |
| `_id`         | ObjectId | Mongo default                              |
| `name`        | string   | Required; maps to `ExampleDto.name`        |
| `description` | string   | Optional; nullable in API DTO              |
| `createdAt`   | Date     | Set on write; exposed as ISO string in API |

Writers: `apps/api` ExamplesModule only. Legacy app does not write here.

## `a_users` (platform auth — ADR-003)

App-owned password accounts for the new API. **Not** the legacy `users` collection (warehouse auth: [`legacy/auth-legacy.md`](../legacy/auth-legacy.md)).

| Field          | Type     | Notes                                  |
| -------------- | -------- | -------------------------------------- |
| `_id`          | ObjectId | Mongo default                          |
| `email`        | string   | Required; unique; normalized lowercase |
| `username`     | string   | Required; unique                       |
| `passwordHash` | string   | Argon2id (never store plaintext)       |
| `createdAt`    | Date     | Set on create                          |
| `updatedAt`    | Date     | Set on update                          |

Writers: Auth / Users module in `apps/api` (T15+). Legacy must not write here. Dual-read/link with legacy `users` is **[ADR-004](../adr/004-legacy-users-dual-read.md)** (Deferred; out of platform scope).

## `a_refresh_tokens` (platform auth)

Stores refresh-session metadata for rotation / revoke. Raw refresh JWT is **not** stored — only a hash of `jti` (and related metadata).

| Field       | Type     | Notes                                            |
| ----------- | -------- | ------------------------------------------------ |
| `_id`       | ObjectId | Mongo default                                    |
| `jti`       | string   | Hash of JWT `jti`; unique                        |
| `userId`    | ObjectId | Ref to `a_users._id`                             |
| `expiresAt` | Date     | Absolute expiry; optional TTL index (~7d policy) |
| `createdAt` | Date     | Issued at                                        |
| `revokedAt` | Date?    | Set on logout / rotation invalidate              |

Writers: Auth module in `apps/api` (T15+). TTL index (if enabled) deletes expired docs automatically; revoke still wins for active sessions.

## `users` (legacy)

Authoritative writer: **legacy app**. New app mode: **read-only until ADR-004**. No inserts/updates/deletes from `apps/api` until [ADR-004](../adr/004-legacy-users-dual-read.md) is Accepted + inventory mode change + feature flag. Consistent with [ADR-001](../adr/001-shared-mongodb-with-legacy.md). Shape reference: [`legacy/auth-legacy.md`](../legacy/auth-legacy.md).
