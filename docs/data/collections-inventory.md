# Collections inventory (legacy MongoDB)

| Collection           | Writers      | Readers           | Key fields                         | Indexes (read-only note) | New app mode            |
| -------------------- | ------------ | ----------------- | ---------------------------------- | ------------------------ | ----------------------- |
| _foundation_examples | new API only | new API           | _id, name, description?, createdAt | _id default              | read/write              |
| users                | legacy       | legacy, new (TBD) | ...                                | ...                      | read-only until ADR-002 |

## Rules

- No index/createCollection from new app until row approved.
- Schema changes: additive only unless ADR says otherwise.
- **Index policy:** do not create, drop, or modify indexes on legacy collections without an ADR. The new app may only manage indexes on `_foundation_*` collections after inventory approval.

## `_foundation_examples` (foundation demo)

| Field         | Type     | Notes                                      |
| ------------- | -------- | ------------------------------------------ |
| `_id`         | ObjectId | Mongo default                              |
| `name`        | string   | Required; maps to `ExampleDto.name`        |
| `description` | string   | Optional; nullable in API DTO              |
| `createdAt`   | Date     | Set on write; exposed as ISO string in API |

Writers: `apps/api` ExamplesModule only. Legacy app does not write here.
