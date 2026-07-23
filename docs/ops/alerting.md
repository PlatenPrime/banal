# Alerting (stub)

Platform-v1 does **not** require a paid error/APM vendor. Ops triage starts from structured API logs and health checks.

## Current (platform)

1. **Railway logs** — JSON stdout; filter by `requestId` / error `msg` ([deploy/railway.md](../deploy/railway.md)#logs).
2. **Health** — `GET /health` and `GET /health/ready` after deploy or incident.
3. **Manual escalation** — copy relevant log lines + request ids into the incident note; follow [incident-rollback.md](incident-rollback.md).

No pager / Slack bot / Sentry project is part of the platform freeze.

## Future optional (anti-goal today)

| Tool              | Status                                                                         |
| ----------------- | ------------------------------------------------------------------------------ |
| Sentry            | Future optional — not required for `platform-v1.0.0`                           |
| Datadog / similar | Future optional — same                                                         |
| OTel OTLP         | Optional behind `OTEL_ENABLED` (traces only); not a substitute for on-call yet |

Do **not** block deploys on a vendor SDK. If a team later adds Sentry/Datadog, keep it behind env flags and document in this file.

## Related

- [observability.md](observability.md) — logs, request-id, OTel
- [incident-rollback.md](incident-rollback.md)
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T20 anti-goal: no required Sentry/Datadog
