# Track 23 — Custom Domains & Cookie Prod freeze checklist

Closes **T23** (steps **219–226**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title             | Status | Evidence                                                                                                                                                                      |
| ---- | ----------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 219  | Domain plan       | done   | Parent `banal.app`; [`deploy/README.md`](deploy/README.md)#custom-domains-t23--domain-plan                                                                                    |
| 220  | DNS + TLS         | done\* | Runbooks in [`vercel.md`](deploy/vercel.md)#custom-domain-appbanalapp + [`railway.md`](deploy/railway.md)#custom-domain-apibanalapp; **live attach gated** until domain owned |
| 221  | COOKIE_DOMAIN     | done\* | Target `.banal.app` documented; apply per [`cookie-cutover.md`](deploy/cookie-cutover.md) after TLS                                                                           |
| 222  | SameSite=Lax prod | done   | [`adr/002-auth-jwt-cookies.md`](adr/002-auth-jwt-cookies.md) prod profile; cutover → `lax`                                                                                    |
| 223  | CORS prod origin  | done\* | Target `WEB_ORIGIN=https://app.banal.app`; live apply with cutover                                                                                                            |
| 224  | HSTS note         | done   | [`cookie-cutover.md`](deploy/cookie-cutover.md)#hsts                                                                                                                          |
| 225  | Cutover checklist | done   | [`deploy/cookie-cutover.md`](deploy/cookie-cutover.md) signed-off section                                                                                                     |
| 226  | T23 freeze        | done\* | this file; **live** login→me→logout on custom domains pending ownership gate                                                                                                  |

\*Docs and runbooks complete 2026-07-25. Production remains on interim `*.vercel.app` / `*.up.railway.app` + `SameSite=None` until `banal.app` DNS is owned and the cutover checklist sign-off is filled.

## Planned production profile

| Item                   | Value                       |
| ---------------------- | --------------------------- |
| Web                    | `https://app.banal.app`     |
| API                    | `https://api.banal.app`     |
| `COOKIE_DOMAIN`        | `.banal.app`                |
| `AUTH_COOKIE_SAMESITE` | `lax`                       |
| `WEB_ORIGIN`           | `https://app.banal.app`     |
| Staging                | unchanged (`SameSite=none`) |

## Verification (when gate clears)

```bash
WEB_BASE_URL=https://app.banal.app node ./scripts/smoke-web.mjs
API_BASE_URL=https://api.banal.app node ./scripts/smoke-api.mjs

curl -i -X OPTIONS https://api.banal.app/api/v1/auth/login \
  -H "Origin: https://app.banal.app" \
  -H "Access-Control-Request-Method: POST"
```

Then browser: login → me → logout; cookies `Domain=.banal.app; SameSite=Lax; Secure; HttpOnly`.

## Related

- Previous: [`track-22-vercel-web-deploy-freeze.md`](track-22-vercel-web-deploy-freeze.md)
- Next track: **T24 — CI/CD Deploy Automation** (227–236)
- Deploy: [`deploy/README.md`](deploy/README.md), [`deploy/cookie-cutover.md`](deploy/cookie-cutover.md)
