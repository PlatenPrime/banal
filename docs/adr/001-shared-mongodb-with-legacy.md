# ADR-001: Shared MongoDB with legacy application

- **Status:** Accepted
- **Date:** 2026-07-22
- **Track:** Foundation T10 (step 093)

## Context

The new monorepo (NestJS API + TanStack Start web) shares one MongoDB with the existing legacy application (strangler fig). Migrating data or switching databases is out of foundation scope. Without explicit rules, two writers can silently break each other's document shapes and indexes.

Related artifacts:

- [`docs/data/collections-inventory.md`](../data/collections-inventory.md)
- [`apps/api/src/compat/README.md`](../../apps/api/src/compat/README.md)

## Decision

### 1. Who writes which collections

| Collection pattern         | New app (`apps/api`)                       | Legacy app           |
| -------------------------- | ------------------------------------------ | -------------------- |
| `_foundation_*`            | **read/write** (foundation demo only)      | no write             |
| `a_*`                      | **read/write** (platform auth / app-owned) | no write             |
| Legacy product collections | **read-only** until a dedicated ADR        | authoritative writer |

- Inventory is the source of truth for writers/readers/mode per collection ([collections-inventory.md](../data/collections-inventory.md)).
- The foundation write demo uses only `_foundation_examples`; platform auth uses `a_users` / `a_refresh_tokens` (ADR-003) — not legacy `users`.
- No `createCollection` / index changes on legacy collections from the new app without an ADR. App-owned `_foundation_*` / `a_*` indexes are managed by the new app after inventory approval.

### 2. Additive schema policy

While legacy and the new app share the database:

1. New fields must be **optional**.
2. Mongoose schemas describe the **actual stored shape**, not an idealized domain model.
3. Mapping goes through the **compat layer**: `LegacyDocument` ↔ DTO (`apps/api/src/compat/`).
4. Rename, delete, or type-narrowing of fields requires a new ADR plus a dual-read / dual-write plan.

### 3. When legacy collection writes are allowed

Write from the new app into a legacy collection is **forbidden by default**.

Allowed only when all of the following hold:

1. A new ADR (e.g. ADR-002+) names the collection and write contract.
2. Inventory row updated to `read/write` (or dual-write) for the new app.
3. Feature flag `ALLOW_LEGACY_WRITE_<COLLECTION>=false` by default; enable only in controlled environments.
4. Dual-write / dual-read period documented with an exit criterion.

### 4. Rollback on application version conflict

If the new app and legacy disagree on document shape or write behavior:

1. **Stop writes** from the new app (disable feature flags; revert deploy if needed).
2. **Legacy remains authoritative** for shared collections.
3. New app may continue **read-only** via compat mappers if reads remain safe.
4. Fix forward with additive fields or a new ADR; do not force a big-bang schema rewrite.

## Consequences

- Domain work on legacy collections starts only after T10 and follows [`docs/domain-module-recipe.md`](../domain-module-recipe.md).
- CI and local tests never use production Mongo; only docker / CI `mongo:7` / isolated `vitest_*` DBs.
- Secrets (`MONGODB_URI`) stay in env and are redacted in logs (T9).

## Alternatives considered

| Alternative                         | Why rejected                                      |
| ----------------------------------- | ------------------------------------------------- |
| Big-bang migrate to Postgres/Prisma | Out of foundation scope; product already on Mongo |
| Dual databases from day one         | Defers strangler; doubles sync risk               |
| Direct writes to legacy without ADR | Silent breakage of legacy readers/writers         |
