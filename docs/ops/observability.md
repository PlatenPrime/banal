# Observability (API)

Production-oriented notes for logs and optional OpenTelemetry. No required SaaS vendor for platform-v1.

## Logging

- Sink: **JSON lines** on stdout (nestjs-pino). Level: `debug` in `development`, `info` in `test` / `production`.
- Per-request lines come from `RequestLoggingInterceptor` (`autoLogging: false` on pino-http).
- Secrets are redacted (`[Redacted]`): Mongo URI, passwords, access/refresh tokens, `Authorization`, `Cookie`.

On Railway, see [deploy/railway.md](../deploy/railway.md)#logs.

## Request correlation

Every request gets a correlation id:

1. Client may send `x-request-id` (alphanumeric / `_` / `-`, max 128). Invalid or missing → API generates a UUID.
2. Middleware sets `req.requestId` and echoes `x-request-id` on the response.
3. The same value is attached to pino as `requestId` (`genReqId` + `customProps`).

Search Railway logs by `requestId` (or match the response header) to follow one request.

## OpenTelemetry (optional)

| Env                           | Role                                      |
| ----------------------------- | ----------------------------------------- |
| `OTEL_ENABLED`                | Default `false` → noop TracerProvider     |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Required when enabled; OTLP HTTP endpoint |

When enabled, the API starts `@opentelemetry/sdk-node` with an OTLP HTTP trace exporter. When disabled or unset, only the noop provider runs (no SDK load, no crash).

### Spans and `request.id`

Request middleware sets span attribute **`request.id`** on the **active** span (same value as `requestId` / `x-request-id`). Without auto-instrumentation there may be no active HTTP span; custom spans created via `getApiTracer()` still correlate when you set `request.id` (or call `attachRequestIdToActiveSpan`).

## Alerting

See [alerting.md](alerting.md) — manual triage via logs; Sentry/Datadog remain future optional.

## Related

- [environments.md](environments.md) — env matrix including OTEL
- [secrets-checklist.md](secrets-checklist.md)
- [deploy/railway.md](../deploy/railway.md)
