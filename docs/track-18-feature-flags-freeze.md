# Track 18 — Feature Flags Skeleton freeze checklist

Closes **T18** (steps **169–174**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                       | Status | Evidence                                                                                        |
| ---- | --------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| 169  | FlagsModule                 | done   | `apps/api/src/flags/` — `FlagsModule` (@Global), `FlagsService`, `flags.spec.ts`                |
| 170  | `AUTH_REGISTRATION_ENABLED` | done   | `AuthService.register` → `FlagsService.isRegistrationEnabled()`; e2e 403 / happy path unchanged |
| 171  | `ALLOW_LEGACY_WRITE_*` stub | done   | `parseAllowLegacyWriteFlags` + `isLegacyWriteAllowed`; no writers; `allow-legacy-write.spec.ts` |
| 172  | Flags doc                   | done   | [`ops/feature-flags.md`](ops/feature-flags.md) — env-only, no LaunchDarkly                      |
| 173  | .env.example flags          | done   | `apps/api/.env.example` — Feature flags section + commented `ALLOW_LEGACY_WRITE_users=false`    |
| 174  | T18 checklist               | done   | this file                                                                                       |

## Verification

```bash
npx nx run api:test
```

## Related

- Previous: [`track-17-auth-web-freeze.md`](track-17-auth-web-freeze.md)
- Next track: **T19 — Quality Expansion** (175–182)
- ADRs: [`adr/001-shared-mongodb-with-legacy.md`](adr/001-shared-mongodb-with-legacy.md)
- Ops: [`ops/feature-flags.md`](ops/feature-flags.md)
