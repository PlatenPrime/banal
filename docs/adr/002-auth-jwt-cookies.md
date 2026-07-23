# ADR-002: Auth via JWT in httpOnly cookies

- **Status:** Accepted
- **Date:** 2026-07-22
- **Track:** Platform T14 (step 123)

## Context

The platform needs password login for the new app without OAuth, magic-link, or a server-side session store. Tokens in `localStorage` are XSS-readable and awkward for SSR on TanStack Start / Vercel. Cross-origin staging (Vercel web ↔ Railway API) and same-site production custom domains need an explicit cookie policy.

Related artifacts:

- [PLATFORM-ROADMAP.md §4 Auth](../PLATFORM-ROADMAP.md#4-auth-зафиксированные-решения)
- [ADR-003 app users](003-app-users-collection.md)
- Shared contracts: `@app/shared-contracts` auth Zod schemas (T14 step 126)

## Decision

### 1. Session model

- **Access JWT** + **refresh JWT** issued by `apps/api`.
- Both delivered only as **httpOnly** cookies (never in JSON response bodies).
- No opaque server session document beyond refresh **jti** metadata in `a_refresh_tokens` (see ADR-003).

| Cookie          | TTL     | Path           | Notes                                        |
| --------------- | ------- | -------------- | -------------------------------------------- |
| `access_token`  | ~15m    | `/`            | Short-lived JWT                              |
| `refresh_token` | ~7d     | `/api/v1/auth` | Rotation; store hash of `jti`, not raw token |
| `csrf`          | session | `/`            | Optional double-submit; not HttpOnly if used |

Flags: `HttpOnly` (except optional `csrf`), `Secure` in non-local envs, `SameSite` per environment profile below.

### 2. Login identifier

Login body is **`username` + `password`** (not email). Email is collected at register and returned on `/auth/me`, but is not the login key for platform-v1.

### 3. Endpoints (under `/api/v1`)

| Method | Path             | Auth              | Notes                                 |
| ------ | ---------------- | ----------------- | ------------------------------------- |
| POST   | `/auth/register` | public            | Only when `AUTH_REGISTRATION_ENABLED` |
| POST   | `/auth/login`    | public            | Sets auth cookies                     |
| POST   | `/auth/logout`   | refresh or access | Clears cookies + revokes jti          |
| POST   | `/auth/refresh`  | refresh cookie    | Rotate refresh; new cookies           |
| GET    | `/auth/me`       | access cookie     | `AuthUser` DTO                        |

`/health`, `/health/ready`, `/api/docs` remain `@Public()`.

### 4. Foundation examples policy

Until a domain module replaces the demo:

- **GET** `/api/v1/examples/*` — **public**
- **POST** `/api/v1/examples/*` — **authenticated** (access cookie required)

### 5. CSRF and cookie profiles

- Mutating methods (`POST`/`PUT`/`PATCH`/`DELETE`): **Origin allowlist** = `WEB_ORIGIN` + preview allowlist/regex (T12). Implemented as Nest middleware (`applyCsrfOriginMiddleware`); missing or non-allowlisted Origin → **403** Problem Details.
- **Double-submit `csrf` cookie is deferred** for platform-v1: Origin allowlist + httpOnly cookies + SameSite profiles are the mandatory CSRF controls. Revisit if a non-browser or third-party cookie client needs defense in depth beyond Origin.
- **Preview** (e.g. `*.vercel.app` ↔ Railway preview): `SameSite=None; Secure` when cross-site.
- **Production** custom domains (`app.` + `api.` on one parent): `SameSite=Lax`, `COOKIE_DOMAIN=.example.com`.

### 6. Registration gate

- `AUTH_REGISTRATION_ENABLED=false` in production by default.
- First admin via bootstrap CLI (T15); not part of this ADR’s implementation.

### 7. Auth security hardening (T16)

| Control             | Behavior                                                                 |
| ------------------- | ------------------------------------------------------------------------ |
| Global throttle     | 100 req / 60s / IP (`@nestjs/throttler`)                                 |
| Login throttle      | 5 req / 60s / IP on `POST /auth/login` → **429** `rate-limited`          |
| Account lockout     | 5 failed attempts → `lockedUntil` +15m; same generic 401 as bad password |
| Generic auth errors | Login never distinguishes unknown user vs bad password                   |
| Tokens in JSON      | Never; access/refresh only via httpOnly cookies                          |
| Log redact          | password, tokens, `Authorization`, `Cookie`, `MONGODB_URI`               |
| `TRUST_PROXY`       | When true, `app.set('trust proxy', 1)` for Secure cookies behind Railway |

## Consequences

- Nest AuthModule, cookie helpers, and OpenAPI paths land in **T15**; security hardening (throttling, lockout, generic errors, CSRF Origin, trust proxy, redact) in **T16**.
- Web must call API with `credentials: 'include'` and send an allowlisted `Origin` on mutations; CORS must allow the web origin with credentials.
- JWT secrets and cookie env vars stay in Railway / local `.env` only (T12).

## Alternatives considered

| Alternative                | Why rejected                                     |
| -------------------------- | ------------------------------------------------ |
| Bearer JWT in localStorage | XSS-readable; weaker SSR story                   |
| Server session store only  | Extra infra; cookies + jti store is enough       |
| Login by email             | Product choice for v1: username is the login key |
| Always SameSite=None       | Weaker prod posture; custom domains enable Lax   |
