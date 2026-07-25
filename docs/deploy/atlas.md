# Mongo Atlas — connection & network policy

Canonical Atlas policy for the platform API (Track **T13**). DB naming and env placement: [ops/environments.md](../ops/environments.md). Shared-cluster rules with legacy: [ADR-001](../adr/001-shared-mongodb-with-legacy.md). Secrets: [ops/secrets-checklist.md](../ops/secrets-checklist.md).

## Connection policy

### Where `MONGODB_URI` lives

| Store                        | Allowed                                      |
| ---------------------------- | -------------------------------------------- |
| Railway staging / production | Atlas URI for `app_staging` / `btw` (legacy) |
| Local `apps/api/.env`        | Docker Mongo or a **non-prod** Atlas URI     |
| GitHub Actions CI            | Docker `mongo:7` → `app_foundation_ci` only  |
| Vercel / any `VITE_*`        | **Never** — browser must not see Mongo creds |

**Rule:** CI and local automation **never** use Atlas URIs that point at `app_prod` or `app_staging`. Aligns with ADR-001 and the T12 env matrix.

### Recommended URI query params

When building the Atlas connection string for Railway (or a dedicated non-prod Atlas DB), include:

| Param         | Value       | Why                                     |
| ------------- | ----------- | --------------------------------------- |
| `retryWrites` | `true`      | Safe retries for retryable writes       |
| `w`           | `majority`  | Acknowledge writes to majority of nodes |
| `appName`     | `banal-api` | Identify this app in Atlas metrics/logs |

Example shape (placeholders only — never commit real credentials):

```text
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/app_staging?retryWrites=true&w=majority&appName=banal-api
```

Local Docker Compose typically needs no Atlas-specific params:

```text
mongodb://127.0.0.1:27017/app_foundation_dev
```

### Shared cluster and database layout

Staging and production share the Atlas **cluster** with the legacy app. Since 2026-07-25 **production uses the legacy database itself** (`btw`) — the target ADR-001 strangler layout: the API owns only `_foundation_*` / `a_*` collections there and treats legacy collections as read-only. **Staging** uses a separate database **`app_staging`** on the same cluster so e2e/preview traffic never touches live data. Collection ownership and write modes are governed by [collections-inventory.md](../data/collections-inventory.md) and ADR-001 — not by URI alone.

## Network access

### Staging and production

1. Prefer an **IP allowlist** (or Atlas private networking when available) that admits Railway egress for the API service(s).
2. **2026-07-25 (swap done):** staging/prod API moved from interim Railway Mongo to **Atlas** (`cluster0`, prod DB `btw`, staging DB `app_staging`). Network Access currently `0.0.0.0/0` — recorded ops exception (see risk note below); tighten when stable Railway egress is available. Details: [railway.md](railway.md)#atlas-network-railway.
3. Keep Atlas Database Users scoped per environment (staging vs prod credentials; least privilege). **Current state:** one shared DB user for both environments — split into per-env users as a follow-up.

### `0.0.0.0/0` risk note

Allowing **`0.0.0.0/0`** (open internet) on Atlas Network Access is **discouraged**. Use it only when Railway egress IPs are dynamic/unavailable and no VPC peer exists.

If unavoidable:

- Treat it as a temporary ops exception; record who approved and a revisit date.
- Compensate with strong DB user passwords, SCRAM, and no prod URI outside Railway.
- Prefer tightening the allowlist as soon as stable egress or private link is available.

Local development should use Docker Compose Mongo (or a personal Atlas project allowlisted to the developer IP) — not production Network Access rules.

## Health: liveness vs readiness

Implementation: [`apps/api/src/health/health.controller.ts`](../../apps/api/src/health/health.controller.ts).

| Probe     | Path                | Mongo dependency                    | Typical use                          |
| --------- | ------------------- | ----------------------------------- | ------------------------------------ |
| Liveness  | `GET /health`       | None                                | Process up; Railway/K8s restart gate |
| Readiness | `GET /health/ready` | `MongooseHealthIndicator.pingCheck` | Traffic only when DB responds        |

### Mongo ping failure → 503

If the Mongo ping fails, `/health/ready` returns **HTTP 503** with a readiness body (`status: error` / details). Orchestrators and load balancers should:

- Use `/health` for restart decisions (do not restart solely because Mongo is briefly down).
- Use `/health/ready` to stop sending traffic until the API can reach Mongo again.

### Boot fail-fast (optional)

Failing the Nest process on boot when Mongo is unreachable is an **optional** ops choice (not required for platform T13). Current behavior: API can start; readiness stays 503 until Mongo is reachable. Enforce boot fail-fast later only if deploy runbooks (T21+) need it explicitly.

## Related

- [deploy/README.md](README.md)
- [deploy/railway.md](railway.md) — `TRUST_PROXY`; Atlas DB names on Railway
- [LOCAL_SETUP.md](../LOCAL_SETUP.md) — local Docker Mongo
- [PLATFORM-ROADMAP.md](../PLATFORM-ROADMAP.md) — T13; T21-197 Atlas network on Railway
- [track-13-atlas-network-freeze.md](../track-13-atlas-network-freeze.md)
