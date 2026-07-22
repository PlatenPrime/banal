# Track 14 — Auth Data & ADR freeze checklist

Closes **T14** (steps **123–128**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                | Status | Evidence                                                                                          |
| ---- | -------------------- | ------ | ------------------------------------------------------------------------------------------------- |
| 123  | ADR-002 JWT cookies  | done   | [`adr/002-auth-jwt-cookies.md`](adr/002-auth-jwt-cookies.md) — Accepted                           |
| 124  | ADR-003 app users    | done   | [`adr/003-app-users-collection.md`](adr/003-app-users-collection.md) — Accepted (`a_users`)       |
| 125  | ADR-004 stub pointer | done   | [`adr/004-legacy-users-dual-read.md`](adr/004-legacy-users-dual-read.md) — Deferred               |
| 126  | Contracts auth DTOs  | done   | `@app/shared-contracts` `auth.ts`: Login / Register / AuthUser                                    |
| 127  | Problem Details auth | done   | `rateLimited` URI + `fixtures/problem-details/rate-limited.json`; unauthorized/forbidden retained |
| 128  | T14 checklist        | done   | this file                                                                                         |

## OpenAPI note (planned for T15)

Nest/Swagger DTO mirrors of auth Zod schemas and `/api/v1/auth/*` paths are **not** exported in T14. They land with AuthController + `openapi:export` / `openapi:check` in **T15** (steps 136–142).

## Verification

```bash
npx nx run shared-contracts:test
# Review:
# - docs/adr/002-auth-jwt-cookies.md
# - docs/adr/003-app-users-collection.md
# - docs/adr/004-legacy-users-dual-read.md
```

## Related

- Platform acceptance: [`track-platform-acceptance.md`](track-platform-acceptance.md)
- Previous: [`track-13-atlas-network-freeze.md`](track-13-atlas-network-freeze.md)
- Next track: **T15 — Auth API** (129–145)
