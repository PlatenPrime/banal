# ADR-004: Legacy `users` dual-read (stub)

- **Status:** Deferred / not implemented
- **Date:** 2026-07-22
- **Track:** Platform T14 (step 125) — pointer only; implementation **after** `platform-v1.0.0`

## Context

Platform password auth uses **`a_users`** / **`a_refresh_tokens`** (ADR-003) — a separate collection in the shared MongoDB, not the warehouse `users` collection. Legacy product accounts and their Nest-target contract (bcrypt, roles, Bearer JWT, no email) are described in [`docs/legacy/auth-legacy.md`](../legacy/auth-legacy.md).

Legacy `users` remains **read-only until this ADR is accepted and implemented** ([collections inventory](../data/collections-inventory.md), [ADR-001](001-shared-mongodb-with-legacy.md)).

Platform roadmap anti-goals explicitly exclude dual-read/write with legacy `users` during T11–T25.

## Decision (stub — not binding until Accepted)

When this ADR is promoted to **Accepted**, it will define:

1. How `a_users` links to legacy `users` (stable id / email / username mapping), if ever.
2. Dual-read order and conflict rules (which store is authoritative for login).
3. Whether dual-write is ever allowed, under which feature flags (`ALLOW_LEGACY_WRITE_*`).
4. Exit criteria to drop dual-read and inventory mode change.

Until then:

- New app **must not** insert/update/delete legacy `users`.
- Platform auth uses only `a_users` / `a_refresh_tokens`.
- Do **not** treat [`auth-legacy.md`](../legacy/auth-legacy.md) as the platform auth contract.

## Consequences

- No schema or API work for legacy login in T15–T25.
- Domain modules that need legacy user reads follow [`domain-module-recipe.md`](../domain-module-recipe.md) and a future Accepted revision of this ADR.

## Alternatives considered

| Alternative                                 | Why deferred / rejected now                    |
| ------------------------------------------- | ---------------------------------------------- |
| Implement dual-read in platform v1          | Out of scope; product chose isolated `a_users` |
| Migrate all legacy users into `a_users` now | Big-bang; not required for platform auth       |
| Reuse collection name `users`               | Collides with legacy; use `a_users` instead    |
