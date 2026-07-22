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

- Mutating methods (`POST`/`PUT`/`PATCH`/`DELETE`): **Origin allowlist** = `WEB_ORIGIN` + preview allowlist/regex (T12).
- Optional double-submit `csrf` cookie may be added later; Origin check is mandatory for platform auth.
- **Preview** (e.g. `*.vercel.app` ↔ Railway preview): `SameSite=None; Secure` when cross-site.
- **Production** custom domains (`app.` + `api.` on one parent): `SameSite=Lax`, `COOKIE_DOMAIN=.example.com`.

### 6. Registration gate

- `AUTH_REGISTRATION_ENABLED=false` in production by default.
- First admin via bootstrap CLI (T15); not part of this ADR’s implementation.

## Consequences

- Nest AuthModule, cookie helpers, and OpenAPI paths land in **T15**; security hardening (throttling, lockout, generic errors) in **T16**.
- Web must call API with `credentials: 'include'`; CORS must allow the web origin with credentials.
- JWT secrets and cookie env vars stay in Railway / local `.env` only (T12).

## Alternatives considered

| Alternative                | Why rejected                                     |
| -------------------------- | ------------------------------------------------ |
| Bearer JWT in localStorage | XSS-readable; weaker SSR story                   |
| Server session store only  | Extra infra; cookies + jti store is enough       |
| Login by email             | Product choice for v1: username is the login key |
| Always SameSite=None       | Weaker prod posture; custom domains enable Lax   |
