# Track 3 — API Platform checklist (steps 031–047)

Mini-checklist for **T3 — API Platform**. Step **048** closes this track; readiness Mongo stub is replaced in **T4-050**.

| Step | Title                      | Verification                               | Key artifacts                                                                                                                       |
| ---- | -------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| 031  | ConfigModule + Zod env     | Boot fails on missing `MONGODB_URI`        | [`apps/api/src/config/env.schema.ts`](../apps/api/src/config/env.schema.ts)                                                         |
| 032  | Global ValidationPipe      | Extra body fields → 422                    | [`apps/api/src/config/validation.pipe.ts`](../apps/api/src/config/validation.pipe.ts)                                               |
| 033  | ApiExceptionFilter         | Unknown errors → 500 without stack         | [`apps/api/src/errors/api-exception.filter.ts`](../apps/api/src/errors/api-exception.filter.ts)                                     |
| 034  | URI versioning             | Routes under `/api/v1/*`                   | [`apps/api/src/config/api-versioning.ts`](../apps/api/src/config/api-versioning.ts)                                                 |
| 035  | Helmet + security headers  | Security headers on responses              | [`apps/api/src/config/security-headers.ts`](../apps/api/src/config/security-headers.ts)                                             |
| 036  | Terminus liveness          | `GET /health` → 200                        | [`apps/api/src/health/health.controller.ts`](../apps/api/src/health/health.controller.ts)                                           |
| 037  | Readiness stub             | `GET /health/ready` → 503 until Mongo (T4) | [`apps/api/src/health/stub-mongo.health-indicator.ts`](../apps/api/src/health/stub-mongo.health-indicator.ts) _(removed in T4-050)_ |
| 038  | Health DTOs from contracts | Response matches Zod                       | [`apps/api/src/health/health-response.ts`](../apps/api/src/health/health-response.ts)                                               |
| 039  | Request ID middleware      | `x-request-id` echoed/generated            | [`apps/api/src/config/request-id.middleware.ts`](../apps/api/src/config/request-id.middleware.ts)                                   |
| 040  | Swagger stub               | `GET /api/docs`, `/api/docs-json`          | [`apps/api/src/config/swagger.ts`](../apps/api/src/config/swagger.ts)                                                               |
| 041  | ExamplesModule skeleton    | `GET /api/v1/examples` → empty list        | [`apps/api/src/examples/`](../apps/api/src/examples/)                                                                               |
| 042  | CreateExampleDto           | Invalid body → 422                         | [`apps/api/src/examples/create-example.dto.ts`](../apps/api/src/examples/create-example.dto.ts)                                     |
| 043  | Graceful shutdown          | `enableShutdownHooks()` in bootstrap       | [`apps/api/src/main.ts`](../apps/api/src/main.ts)                                                                                   |
| 044  | Global API prefix config   | Single source for versioned paths          | [`apps/api/src/config/api-versioning.ts`](../apps/api/src/config/api-versioning.ts)                                                 |
| 045  | 404 → Problem Details      | Unknown route → `application/problem+json` | [`apps/api/test/exception-filter.e2e-spec.ts`](../apps/api/test/exception-filter.e2e-spec.ts)                                       |
| 046  | 422 validation mapping     | Field errors in problem body               | [`apps/api/src/config/validation-errors.ts`](../apps/api/src/config/validation-errors.ts)                                           |
| 047  | Correlation in logs        | `requestId` in pino via middleware         | [`apps/api/src/config/logger.config.ts`](../apps/api/src/config/logger.config.ts)                                                   |

## Smoke commands

```bash
nx run api:test
nx run api:build
# With mongo (after T4): curl http://localhost:4000/health/ready
```

## Notes

- **Readiness:** Step 037 used a stub indicator; real Mongo ping lands in **T4-050**.
- **Examples write:** POST returned 501 until **T4-055** persistence.
- **Full request logging / redact:** Deferred to **T9** (step 047 added correlation-only pino).
