# Cookie cutover — preview → production (T23)

Move production auth cookies from interim cross-site `SameSite=None` (`*.vercel.app` ↔ `*.up.railway.app`) to first-party `SameSite=Lax` on parent **`banal.app`**.

Related: [README.md](README.md)#custom-domains-t23--domain-plan, [vercel.md](vercel.md)#custom-domain-appbanalapp, [railway.md](railway.md)#custom-domain-apibanalapp, [ADR-002](../adr/002-auth-jwt-cookies.md), [ops/environments.md](../ops/environments.md).

## Target hosts

| Role | Host                    | Platform                                   |
| ---- | ----------------------- | ------------------------------------------ |
| Web  | `https://app.banal.app` | Vercel `banal-web-production`              |
| API  | `https://api.banal.app` | Railway `api` / environment **production** |

Staging stays on platform hostnames with `AUTH_COOKIE_SAMESITE=none`.

## Preconditions (gate)

- [ ] Parent domain `banal.app` registered; DNS editable.
- [ ] `app.banal.app` added on Vercel Domains → **Valid** + browser padlock.
- [ ] `api.banal.app` added on Railway Networking → certificate ready + `GET /health` 200.
- [ ] Staging auth still green (do not break interim staging while cutting prod).

**If the gate is not met:** leave production on interim URLs and `SameSite=None`. Do not set `COOKIE_DOMAIN` or `lax` on prod yet.

## Cutover order (critical)

Apply **after** both custom domains show Valid TLS.

1. **Vercel production** — set `VITE_API_URL=https://api.banal.app` (Production env) → **Redeploy** production.
2. **Railway production** — set in **one** Variables save / redeploy:
   - `WEB_ORIGIN=https://app.banal.app`
   - `COOKIE_DOMAIN=.banal.app`
   - `AUTH_COOKIE_SAMESITE=lax`
   - Ensure `WEB_ORIGIN_PREVIEW_REGEX` and `WEB_ORIGIN_PREVIEW_LIST` are **unset** on production.
3. Confirm `TRUST_PROXY=1` remains on Railway production.

Do not flip SameSite to `lax` while the browser still loads the API from a different site than the web origin (cross-site). Domains must share parent `banal.app` first.

## Verify

```bash
# Padlock + health
curl -sS -o /dev/null -w "%{http_code}" https://app.banal.app/
curl -sS https://api.banal.app/health
curl -sS https://api.banal.app/health/ready

# CORS preflight (expect exact origin echo + credentials; no *)
curl -i -X OPTIONS https://api.banal.app/api/v1/auth/login \
  -H "Origin: https://app.banal.app" \
  -H "Access-Control-Request-Method: POST"

# Web SSR smoke
WEB_BASE_URL=https://app.banal.app node ./scripts/smoke-web.mjs
```

Browser (incognito):

1. Open `https://app.banal.app/login`.
2. Sign in (bootstrap admin if needed).
3. DevTools → Application → Cookies for `api.banal.app` / `.banal.app`: `HttpOnly`, `Secure`, `SameSite=Lax`, `Domain=.banal.app`.
4. Confirm `/auth/me` succeeds (session).
5. Logout → cookies cleared.

## Rollback

1. Railway production: restore `WEB_ORIGIN=https://banal-web-production.vercel.app`, unset `COOKIE_DOMAIN`, set `AUTH_COOKIE_SAMESITE=none`.
2. Vercel production: restore `VITE_API_URL=https://api-production-b6c9.up.railway.app` → redeploy.
3. Users may need to clear stale `.banal.app` cookies once; then re-login on interim hosts.
4. Smoke interim URLs with `scripts/smoke-web.mjs` / `scripts/smoke-api.mjs`.

## HSTS

Railway and Vercel terminate TLS at their edges. Platform-v1 does **not** require a custom long-max-age HSTS preload on the apex.

| Surface      | Note                                                                           |
| ------------ | ------------------------------------------------------------------------------ |
| Vercel       | May send HSTS on HTTPS responses for attached custom domains                   |
| Railway      | TLS at the edge for public domains; Nest does not set HSTS itself              |
| Preload list | **Do not** submit `banal.app` to HSTS preload without an explicit ops decision |

Document any future CDN in front of these hosts here before enabling preload.

## Sign-off

| Check                                   | Owner | Date |
| --------------------------------------- | ----- | ---- |
| DNS + TLS Valid on `app.` and `api.`    |       |      |
| Env cutover applied (Vercel + Railway)  |       |      |
| login → me → logout on custom domains   |       |      |
| Staging unchanged (Still SameSite=None) |       |      |

Live cutover signed off: _pending until ownership gate clears_ (docs ready 2026-07-25).
