# Railway (API) — stub

Full deploy runbook lands in **Track 21**. Until then, use this note with [ops/secrets-checklist.md](../ops/secrets-checklist.md) and [ops/environments.md](../ops/environments.md).

## TRUST_PROXY

Railway terminates TLS and proxies to the Nest process. For Secure cookies and correct client IP behavior, set:

```text
TRUST_PROXY=1
```

Local development should keep `TRUST_PROXY=0` (or omit). Nest wires `app.set('trust proxy', 1)` when `TRUST_PROXY` is truthy (T16 step 151).

## Logs

API logs are **newline-delimited JSON** on stdout (nestjs-pino). There is no pretty transport in staging/prod.

### Where to read

1. Railway dashboard → API service → **Logs** (live stream of container stdout/stderr).
2. CLI (when the service exists): `railway logs` against the linked project/service.

### Useful fields

| Field       | Meaning                                     |
| ----------- | ------------------------------------------- |
| `level`     | pino numeric level (`info` default in prod) |
| `msg`       | message                                     |
| `requestId` | correlation id (same as `x-request-id`)     |
| `req` / URL | request shape from the logging interceptor  |

Filter in the UI/CLI by `requestId` (or the echoed `x-request-id` from a client) to reconstruct one request.

Secrets (Mongo URI, passwords, JWT/cookie/`Authorization`) are **redacted** to `[Redacted]` — see logger redact paths.

### Retention

Retention follows **Railway’s platform policy** for the service plan (no external ELK/Datadog required for platform-v1). Do not assume infinite history; copy incident lines into the incident note when needed. Optional OTLP tracing is separate — see [ops/observability.md](../ops/observability.md).

## Variables

See the Railway table in [secrets-checklist.md](../ops/secrets-checklist.md). Staging and production are **separate** services with separate Atlas DB names (`app_staging` / `app_prod`).

## Related

- [atlas.md](atlas.md) — Atlas URI params, network allowlist policy, readiness
- [ops/observability.md](../ops/observability.md) — request-id ↔ logs/traces
- [ops/alerting.md](../ops/alerting.md) — alerting stub (no required SaaS)
- [LOCAL_SETUP.md](../LOCAL_SETUP.md)#trust_proxy
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T21 Railway API
- [incident-rollback.md](../ops/incident-rollback.md)
