# Secrets checklist

Where secrets and sensitive env vars live for banal (Track 12). Environment matrix: [environments.md](environments.md). Security policy: [SECURITY.md](../../SECURITY.md). Rollback: [incident-rollback.md](incident-rollback.md).

**Never** commit real secrets, put them in `VITE_*`, or paste them into public docs / issues.

## Railway (API — staging and production)

Separate services for staging and production. Full list mirrors `apps/api` Zod schema ([`env.schema.ts`](../../apps/api/src/config/env.schema.ts)).

| Variable                      | Required | Notes                                            |
| ----------------------------- | -------- | ------------------------------------------------ |
| `NODE_ENV`                    | yes      | `production`                                     |
| `PORT`                        | yes      | Often set by Railway                             |
| `MONGODB_URI`                 | yes      | Atlas; DB name `app_staging` or `app_prod`       |
| `WEB_ORIGIN`                  | yes      | Exact web origin URL                             |
| `WEB_ORIGIN_PREVIEW_REGEX`    | no       | Staging: Vercel preview pattern                  |
| `WEB_ORIGIN_PREVIEW_LIST`     | no       | Comma-separated extra origins                    |
| `JWT_ACCESS_SECRET`           | yes      | ≥32 chars; unique per environment                |
| `JWT_REFRESH_SECRET`          | yes      | ≥32 chars; **must differ** from access secret    |
| `COOKIE_DOMAIN`               | prod     | e.g. `.example.com` after custom domains (T23)   |
| `AUTH_COOKIE_SAMESITE`        | yes      | `lax` prod; `none` interim for previews (T22)    |
| `AUTH_REGISTRATION_ENABLED`   | yes      | Default `false`                                  |
| `TRUST_PROXY`                 | yes      | **`1`** on Railway (Secure cookies behind proxy) |
| `OTEL_ENABLED`                | no       | Default `false`                                  |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | if OTEL  | Required when `OTEL_ENABLED=true`                |

See also [deploy/railway.md](../deploy/railway.md).

## Vercel (web)

| Variable       | Required | Notes                                      |
| -------------- | -------- | ------------------------------------------ |
| `VITE_API_URL` | yes      | Absolute API base URL for that environment |

**No** JWT secrets, Mongo URIs, or other API secrets on Vercel. Vite embeds `VITE_*` into the client bundle.

## GitHub

| Context             | Content                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| Actions CI (e2e)    | `mongo:7` service; `MONGODB_URI=…/app_foundation_ci`; dummy JWT secrets |
| GitHub Environments | Deploy secrets for T24 automation (not used until then)                 |
| Repository secrets  | Prefer Environments over org-wide when possible                         |

CI must **never** receive Atlas prod/staging URIs.

## Local

```bash
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

- `apps/api/.env` and `apps/web/.env` are gitignored.
- Use placeholder-length JWT secrets locally (≥32 chars); do not reuse production values.
- See [LOCAL_SETUP.md](../LOCAL_SETUP.md).

## JWT secret rotation

Rotating `JWT_ACCESS_SECRET` and/or `JWT_REFRESH_SECRET` **invalidates all existing sessions**.

1. Generate two new independent secrets (≥32 random characters each).
2. Update both values on the target Railway service (staging or production).
3. Redeploy the API so the new schema-validated env is loaded.
4. Users must sign in again; refresh tokens signed with the old secret will fail verification.
5. Record the change in the incident note if done under pressure; coordinate with [incident-rollback.md](incident-rollback.md) if a bad deploy prompted the rotation.

Prefer rotating **access and refresh together** so there is no mixed-secret window. Do not put rotation values in git or chat logs.

## Related

- [environments.md](environments.md)
- [SECURITY.md](../../SECURITY.md)
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — Track 12
