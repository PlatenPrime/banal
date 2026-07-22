# Track 15 — Auth API freeze checklist

Closes **T15** (steps **129–145**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                      | Status | Evidence                                                               |
| ---- | -------------------------- | ------ | ---------------------------------------------------------------------- |
| 129  | UsersModule schema         | done   | `apps/api/src/users/` — `a_users` + unique email/username              |
| 130  | RefreshToken schema        | done   | `apps/api/src/auth/refresh-token.schema.ts` — `a_refresh_tokens` + TTL |
| 131  | Argon2id service           | done   | `PasswordService` via `@node-rs/argon2`                                |
| 132  | Jwt module config          | done   | `AuthModule` + env secrets; access ~15m / refresh ~7d                  |
| 133  | Cookie helpers             | done   | `setAuthCookies` / `clearAuthCookies`; CORS `credentials: true`        |
| 134  | AuthService login/register | done   | create user, issue tokens, store jti hash                              |
| 135  | AuthService refresh/logout | done   | rotate + revoke                                                        |
| 136  | AuthController             | done   | `/api/v1/auth/*` + Swagger DTOs                                        |
| 137  | JwtAuthGuard + `@Public()` | done   | global `APP_GUARD`; health/docs/login/register/refresh/logout public   |
| 138  | GET `/auth/me`             | done   | 401 without access cookie (Problem Details)                            |
| 139  | Examples POST auth         | done   | GET public; POST requires access cookie                                |
| 140  | Bootstrap admin CLI        | done   | `nx run api:bootstrap-admin` (`BOOTSTRAP_ADMIN_*` env)                 |
| 141  | Register behind flag       | done   | `AUTH_REGISTRATION_ENABLED=false` → **403**                            |
| 142  | OpenAPI export auth        | done   | `/api/v1/auth/*` in `apps/api/openapi/openapi.json`                    |
| 143  | Web client types regen     | done   | `apps/web/src/lib/api/generated/schema.d.ts`                           |
| 144  | Auth e2e suite             | done   | `apps/api/test/auth.e2e-spec.ts` — register/login/refresh/logout/me    |
| 145  | T15 checklist              | done   | this file                                                              |

## Verification

```bash
npx nx run api:test
npx nx run api:test:e2e
npm run openapi:export
npm run openapi:generate
# After commit of OpenAPI artifacts:
npm run openapi:check
```

Bootstrap first admin (registration disabled by default):

```bash
# set BOOTSTRAP_ADMIN_EMAIL / USERNAME / PASSWORD + API .env
nx run api:bootstrap-admin
```

## Related

- Previous: [`track-14-auth-data-adr-freeze.md`](track-14-auth-data-adr-freeze.md)
- Next track: **T16 — Auth Security Hardening** (146–155)
- ADRs: [`adr/002-auth-jwt-cookies.md`](adr/002-auth-jwt-cookies.md), [`adr/003-app-users-collection.md`](adr/003-app-users-collection.md)
