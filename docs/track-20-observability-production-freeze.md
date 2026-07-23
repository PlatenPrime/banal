# Track 20 — Observability Production freeze checklist

Closes **T20** (steps **183–190**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                  | Status | Evidence                                                                                                                                                                                  |
| ---- | ---------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 183  | Prod pino levels       | done   | [`logger.config.ts`](../apps/api/src/config/logger.config.ts) — `info` prod/test, `debug` development; JSON sink; [`logger.config.spec.ts`](../apps/api/src/config/logger.config.spec.ts) |
| 184  | Railway logs doc       | done   | [`deploy/railway.md`](deploy/railway.md)#logs — UI/CLI, JSON fields, retention                                                                                                            |
| 185  | OTEL flag wiring       | done   | [`observability/otel.ts`](../apps/api/src/observability/otel.ts) `initOtelFromEnv`; noop when disabled; [`otel.spec.ts`](../apps/api/src/observability/otel.spec.ts)                      |
| 186  | OTLP exporter optional | done   | `@opentelemetry/sdk-node` + `@opentelemetry/exporter-trace-otlp-http` via dynamic import when enabled + endpoint; no crash when unset                                                     |
| 187  | Trace request id       | done   | [`ops/observability.md`](ops/observability.md); `attachRequestIdToActiveSpan` → `request.id`; wired from request-id middleware                                                            |
| 188  | Alerting stub          | done   | [`ops/alerting.md`](ops/alerting.md) — Railway logs + manual triage; Sentry = future optional                                                                                             |
| 189  | Redact audit           | done   | logger spec redacts password, JWT tokens, Authorization, Cookie, set-cookie → `[Redacted]`                                                                                                |
| 190  | T20 checklist          | done   | this file                                                                                                                                                                                 |

## Verification

```bash
npx nx run api:test
```

## Related

- Previous: [`track-19-quality-expansion-freeze.md`](track-19-quality-expansion-freeze.md)
- Next track: **T21 — Railway API Deploy** (191–205)
- Ops: [`ops/observability.md`](ops/observability.md), [`ops/alerting.md`](ops/alerting.md), [`deploy/railway.md`](deploy/railway.md)
