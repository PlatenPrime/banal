# Compat layer

Maps **legacy Mongo document shapes** to **shared-contracts DTOs** and back.

## Rules

1. **Additive only** while legacy apps share the database — new fields must be optional.
2. **Rename/delete** requires an ADR and a dual-read/dual-write plan.
3. Mongoose schemas describe the **actual** stored shape, not an idealized domain model.
4. **No legacy index or collection changes** from the new app without ADR approval (see `docs/data/collections-inventory.md`).

## Layout

- `legacy-types/` — raw document interfaces
- `mappers/` — pure `LegacyDocument` ↔ `AppDto` functions with unit tests
