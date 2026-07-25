# Deploy docs

Environment matrix and secrets: [ops/environments.md](../ops/environments.md), [ops/secrets-checklist.md](../ops/secrets-checklist.md). Atlas connection and network policy: [atlas.md](atlas.md) (T13). Railway API runbook: [railway.md](railway.md) (T21). Vercel web runbook: [vercel.md](vercel.md) (T22). Custom domains & cookie cutover: [cookie-cutover.md](cookie-cutover.md) (T23).

| Doc                                    | Status     | Scope                                                    |
| -------------------------------------- | ---------- | -------------------------------------------------------- |
| [atlas.md](atlas.md)                   | done (T13) | Connection URI policy; network access; readiness         |
| [railway.md](railway.md)               | done (T21) | API on Railway; Dockerfile; env mapping; smoke; rollback |
| [vercel.md](vercel.md)                 | done (T22) | Web on Vercel; monorepo Root Directory; SSR smoke        |
| [cookie-cutover.md](cookie-cutover.md) | done (T23) | Preview → prod cookie profile; DNS gate; rollback        |

Platform acceptance tracks URLs in [track-platform-acceptance.md](../track-platform-acceptance.md).

## Custom domains (T23) — domain plan

**Planned parent:** `banal.app` (brand default; rename in one pass across deploy/ops docs if a different parent is purchased).

| Host            | Platform                              | Purpose        | DNS (typical)                                 |
| --------------- | ------------------------------------- | -------------- | --------------------------------------------- |
| `app.banal.app` | Vercel project `banal-web-production` | Production web | CNAME → Vercel target shown in Domains UI     |
| `api.banal.app` | Railway service `api` (production)    | Production API | CNAME → Railway target shown in Networking UI |

**Staging / preview:** no custom domains. Keep `*.vercel.app` ↔ Railway staging with `AUTH_COOKIE_SAMESITE=none` and `WEB_ORIGIN_PREVIEW_REGEX`.

### Production cookie / CORS profile (after DNS + TLS)

| Variable               | Production value                |
| ---------------------- | ------------------------------- |
| `VITE_API_URL`         | `https://api.banal.app`         |
| `WEB_ORIGIN`           | `https://app.banal.app` (exact) |
| `COOKIE_DOMAIN`        | `.banal.app`                    |
| `AUTH_COOKIE_SAMESITE` | `lax`                           |
| Preview regex / list   | **unset** on production API     |

Cutover order and rollback: [cookie-cutover.md](cookie-cutover.md). HSTS: [HSTS](cookie-cutover.md#hsts). Per-platform attach steps: [vercel.md](vercel.md)#custom-domain-appbanalapp, [railway.md](railway.md)#custom-domain-apibanalapp.

### Ownership gate

Live TLS padlock and env cutover require the parent domain to be registered and DNS editable. Until then, interim prod URLs remain `banal-web-production.vercel.app` / `api-production-b6c9.up.railway.app` with `SameSite=None`.
