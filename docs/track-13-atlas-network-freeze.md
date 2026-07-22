# Track 13 — Atlas & Network freeze checklist

Closes **T13** (steps **115–122**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                           | Status | Evidence                                                                                           |
| ---- | ------------------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| 115  | Atlas connection policy         | done   | [`deploy/atlas.md`](deploy/atlas.md)#connection-policy                                             |
| 116  | Network access                  | done   | [`deploy/atlas.md`](deploy/atlas.md)#network-access                                                |
| 117  | Inventory `_app_users`          | done   | [`data/collections-inventory.md`](data/collections-inventory.md)#_app_users-platform-auth--adr-003 |
| 118  | Inventory `_app_refresh_tokens` | done   | [`data/collections-inventory.md`](data/collections-inventory.md)#_app_refresh_tokens-platform-auth |
| 119  | Legacy `users` row              | done   | inventory: `read-only until ADR-004`; aligned with ADR-001                                         |
| 120  | Index policy app collections    | done   | inventory Rules + unique email/username / jti; TTL note                                            |
| 121  | Readiness timeout note          | done   | [`deploy/atlas.md`](deploy/atlas.md)#health-liveness-vs-readiness                                  |
| 122  | T13 checklist                   | done   | this file                                                                                          |

## Verification

```bash
# Docs review only (no schema code in T13):
# - docs/deploy/atlas.md
# - docs/data/collections-inventory.md
# - docs/adr/001-shared-mongodb-with-legacy.md (_app_* row)
```

## Related

- Platform acceptance: [`track-platform-acceptance.md`](track-platform-acceptance.md)
- Previous: [`track-12-env-secrets-freeze.md`](track-12-env-secrets-freeze.md)
- Next track: **T14 — Auth Data & ADR** (123–128)
