# Track 16 — Auth Security Hardening freeze checklist

Closes **T16** (steps **146–155**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                   | Status | Evidence                                                                                   |
| ---- | ----------------------- | ------ | ------------------------------------------------------------------------------------------ |
| 146  | Throttler global + auth | done   | `@nestjs/throttler`; global 100/min; login 5/min → 429 `rate-limited` Problem Details      |
| 147  | Login lockout           | done   | `failedAttempts` / `lockedUntil` on `a_users`; 5 fails → 15m lock; generic 401             |
| 148  | Generic auth errors     | done   | Same 401 body for unknown user vs bad password; no «user not found» leak on refresh/me     |
| 149  | CSRF Origin middleware  | done   | `applyCsrfOriginMiddleware` — POST/PUT/PATCH/DELETE require allowlisted Origin → 403       |
| 150  | Optional CSRF cookie    | done   | Deferred in ADR-002 §5; Origin allowlist is mandatory; unit covers mutating methods        |
| 151  | TRUST_PROXY wiring      | done   | `applyTrustProxy` → `app.set('trust proxy', 1)` when env truthy                            |
| 152  | No tokens in JSON       | done   | e2e asserts login/register/refresh bodies have no JWT / token fields                       |
| 153  | Redact auth fields      | done   | pino redact password, tokens, Authorization, Cookie (+ MONGODB_URI)                        |
| 154  | Security test suite     | done   | Cookie flags matrix local Lax vs prod-like SameSite=None+Secure; CSRF/throttle/lockout e2e |
| 155  | T16 checklist           | done   | this file + ADR-002 §7                                                                     |

## Verification

```bash
npx nx run api:test
npx nx run api:test:e2e
```

## Related

- Previous: [`track-15-auth-api-freeze.md`](track-15-auth-api-freeze.md)
- Next track: **T17 — Auth Web** (156–168) — closed: [`track-17-auth-web-freeze.md`](track-17-auth-web-freeze.md)
- ADRs: [`adr/002-auth-jwt-cookies.md`](adr/002-auth-jwt-cookies.md), [`adr/003-app-users-collection.md`](adr/003-app-users-collection.md)
