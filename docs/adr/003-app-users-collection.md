# ADR-003: App-owned users collection (`a_users`)

- **Status:** Accepted
- **Date:** 2026-07-22
- **Track:** Platform T14 (step 124)

## Context

Password accounts for the new API must not write the legacy `users` collection (ADR-001). Inventory reserves **`a_users`** and **`a_refresh_tokens`** (not `users`, not `_app_*`) so this service shares MongoDB with legacy without colliding on collection names. This ADR locks ownership, hashing, and index policy before Mongoose schemas (T15).

Platform auth is **intentionally isolated** from the warehouse legacy User model (bcrypt, roles `PRIME`/`ADMIN`/`EDITOR`/`USER`, no email) documented in [`docs/legacy/auth-legacy.md`](../legacy/auth-legacy.md). That file is a reference for the old stack, not the source of truth for platform-v1.

Related artifacts:

- [`docs/data/collections-inventory.md`](../data/collections-inventory.md)
- [ADR-001 shared MongoDB](001-shared-mongodb-with-legacy.md)
- [ADR-002 JWT cookies](002-auth-jwt-cookies.md)
- [ADR-004 legacy dual-read stub](004-legacy-users-dual-read.md)

## Decision

### 1. Collections

| Collection         | New app mode | Legacy   | Purpose                                     |
| ------------------ | ------------ | -------- | ------------------------------------------- |
| `a_users`          | read/write   | no write | Password accounts for platform auth         |
| `a_refresh_tokens` | read/write   | no write | Refresh session metadata (jti hash, expiry) |

Canonical field lists and planned indexes live in the inventory; schemas in T15 must match collection names exactly.

### 2. `a_users` shape (logical)

| Field                     | Notes                                             |
| ------------------------- | ------------------------------------------------- |
| `_id`                     | Mongo ObjectId                                    |
| `email`                   | Required; unique; stored normalized lowercase     |
| `username`                | Required; unique; **login key** (ADR-002)         |
| `passwordHash`            | Argon2id only; never plaintext; never in API DTOs |
| `createdAt` / `updatedAt` | Timestamps                                        |

Public `AuthUser` DTO exposes only `id`, `email`, `username`.

### 3. `a_refresh_tokens` shape (logical)

| Field       | Notes                                                        |
| ----------- | ------------------------------------------------------------ |
| `jti`       | **Hash** of JWT `jti` (unique); raw refresh token not stored |
| `userId`    | Ref `a_users._id`                                            |
| `expiresAt` | Absolute expiry; optional TTL index (~7d policy)             |
| `revokedAt` | Set on logout / rotation invalidate                          |

### 4. Password hashing

- **Argon2id** for all new users (`@node-rs/argon2` or `argon2`).
- No bcrypt for platform accounts (legacy warehouse uses bcrypt — do not mix).
- Verify timing-safe; never log password or hash.

### 5. Indexes (new app may create after inventory approval)

- `a_users`: unique `email`, unique `username`
- `a_refresh_tokens`: unique `jti`; optional TTL on `expiresAt`

### 6. Legacy linkage

Dual-read / account link with legacy `users` is **out of platform scope**. See [ADR-004](004-legacy-users-dual-read.md) (Deferred).

## Consequences

- T15 implements UsersModule + RefreshToken Mongoose schemas and AuthService against these collections only.
- Inventory remains source of truth for writers/readers; any mode change needs inventory + ADR update.
- Registration remains behind `AUTH_REGISTRATION_ENABLED`; bootstrap admin creates the first `a_users` row.

## Alternatives considered

| Alternative                  | Why rejected                                                     |
| ---------------------------- | ---------------------------------------------------------------- |
| Collection name `users`      | Collides with legacy warehouse users                             |
| Login against legacy `users` | Hash/schema/role risk; blocked by ADR-001 until ADR-004          |
| Store raw refresh JWT        | Theft from DB equals full session compromise                     |
| bcrypt for new users         | Roadmap mandates Argon2id; legacy bcrypt stays on legacy `users` |
