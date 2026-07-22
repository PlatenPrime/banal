# Domain module recipe (first legacy collection)

Practical checklist for the **first domain module** after foundation (`foundation-v1.0.0`). Narrative source: [FOUNDATION-ROADMAP.md §19](FOUNDATION-ROADMAP.md#19-после-фундамента-первый-доменный-модуль).

**Do not start** domain work on legacy collections until T10 is closed (see [`track-foundation-acceptance.md`](track-foundation-acceptance.md)).

Default mode: **read-only** against a legacy collection. Writes require a new ADR (see [ADR-001](adr/001-shared-mongodb-with-legacy.md)).

## Read-only legacy collection

1. **Inventory** — add a row to [`docs/data/collections-inventory.md`](data/collections-inventory.md) (name, writers, key fields, indexes snapshot, `New app mode: read-only`).
2. **ADR** — only if you need write or a new/changed index; otherwise skip.
3. **Legacy type** — `apps/api/src/compat/legacy-types/<entity>.document.ts` from a **synthetic** fixture (no PII in git). Mirror layout of `example.document.ts`.
4. **Fixture** — `apps/api/test/fixtures/legacy-<entity>.json`; load in mapper/repository specs.
5. **Mapper** — `apps/api/src/compat/mappers/<entity>.mapper.ts` with unit tests: happy path, nullables, unknown fields ignored. Follow [`apps/api/src/compat/README.md`](../apps/api/src/compat/README.md).
6. **Repository** — `find` / `findById` only; **no** `save`/`update` until a write ADR.
7. **Contracts** — Zod schemas + types in `libs/shared-contracts`; unit tests for parse/invalid payloads.
8. **Service + Controller** — Nest module under `apps/api/src/<domain>/`; DTOs from shared-contracts; Problem Details on errors.
9. **E2E** — `apps/api/test/<domain>.e2e-spec.ts` with isolated `vitest_*` DB (see `apps/api/test/helpers/mongo-test-uri.ts`).
10. **Web** — route under `apps/web/src/routes/` with TanStack Query (loading/error); Form only when write is approved.
11. **OpenAPI** — `npm run openapi:generate` then ensure `npm run openapi:check` stays green.

## Write into legacy (only after ADR)

- Feature flag `ALLOW_LEGACY_WRITE_<COLLECTION>=false` by default.
- Document dual-write period and exit criteria in the ADR.
- Rollback: new app stops writing; legacy remains authoritative ([ADR-001 §4](adr/001-shared-mongodb-with-legacy.md)).

## Reference layout (from foundation examples)

```text
apps/api/src/
├── compat/
│   ├── legacy-types/
│   ├── mappers/
│   └── README.md
├── examples/                 # pattern: schema, repository, service, controller
libs/shared-contracts/src/    # Zod DTOs
apps/web/src/routes/          # Query (+ Form when write allowed)
```

## Definition of Done (domain PR)

1. Inventory row updated.
2. Compat mapper + unit tests.
3. API unit + e2e green; web tests for new route.
4. `npm run ci` green; OpenAPI drift check clean.
5. No legacy index/collection mutations without ADR.
