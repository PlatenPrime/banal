# Railway (API) — stub

Full deploy runbook lands in **Track 21**. Until then, use this note with [ops/secrets-checklist.md](../ops/secrets-checklist.md) and [ops/environments.md](../ops/environments.md).

## TRUST_PROXY

Railway terminates TLS and proxies to the Nest process. For Secure cookies and correct client IP behavior, set:

```text
TRUST_PROXY=1
```

Local development should keep `TRUST_PROXY=0` (or omit). Nest `app.set('trust proxy', 1)` wiring is **Track 16** step 151; the env flag is validated in Zod from Track 12.

## Variables

See the Railway table in [secrets-checklist.md](../ops/secrets-checklist.md). Staging and production are **separate** services with separate Atlas DB names (`app_staging` / `app_prod`).

## Related

- [atlas.md](atlas.md) — Atlas URI params, network allowlist policy, readiness
- [LOCAL_SETUP.md](../LOCAL_SETUP.md)#trust_proxy
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T21 Railway API
- [incident-rollback.md](../ops/incident-rollback.md)
