# Changelog

All notable changes to this project are documented in this file.

## Tag rules

- Baseline freezes use **annotated** git tags: `foundation-vX.Y.Z`, later `platform-vX.Y.Z`.
- Each freeze tag must have a matching section in this file before the tag is created.
- **Do not** rewrite, delete, or force-move a tag that already exists on `origin`.
- Push tags explicitly (`git push origin refs/tags/<name>`); do not rely on accidental `--tags` from unrelated pushes.

## [platform-v1.0.0] — 2026-07-25

Platform baseline frozen (Tracks T11–T25, steps 097–246).

### Platform

- Password auth: JWT access + refresh in **httpOnly** cookies (ADR-002); `app_users` collection (ADR-003)
- Auth API + security hardening + web login/logout/me; Playwright login e2e in CI
- Feature flags + observability (pino; OTel optional behind flag)
- Mongo Atlas network/URI policy; API on **Railway**; web on **Vercel** (staging + production)
- Custom domain & cookie cutover runbooks (`banal.app` plan); interim prod on `*.up.railway.app` / `*.vercel.app` until DNS owned
- CI/CD deploy automation: native Git deploy + Actions Deploy smoke (Environments `staging` / `production`)
- Ops: secrets checklist, incident rollback, environments matrix

### Acceptance artifacts

- Platform checklist ([`docs/track-platform-acceptance.md`](docs/track-platform-acceptance.md))
- Deploy index ([`docs/deploy/README.md`](docs/deploy/README.md))
- Freeze evidence ([`docs/track-25-runbooks-freeze.md`](docs/track-25-runbooks-freeze.md))
- ADR-002 / ADR-003 accepted; ADR-004 stub (legacy dual-read deferred)

### Anti-goals (out of platform scope)

OAuth/magic-link, RBAC UI, Postgres migration, microservice split, mandatory APM vendor lock, legacy `users` dual-read/write, legacy product writes without ADR.

After this tag, product work adds domain modules per [`docs/domain-module-recipe.md`](docs/domain-module-recipe.md) (prefer read-only until write ADR). Live `app.banal.app` / `api.banal.app` cutover remains an owner DNS gate — see T23 cookie-cutover.

## [foundation-v1.0.0] — 2026-07-22

Foundation baseline frozen (Tracks T0–T10, steps 001–096).

### Platform

- Nx monorepo with NestJS 11 API (`apps/api`) and TanStack Start web (`apps/web`)
- Shared Zod contracts (`libs/shared-contracts`): Problem Details, health, example DTOs
- MongoDB via Mongoose: `_foundation_examples` write demo, compat mapper pattern, inventory stub
- Local quality gates: husky, lint-staged, tests-first, Vitest coverage thresholds
- CI: GitHub Actions (ubuntu + windows quality; Mongo e2e), `npm run ci` / `ci:full` parity
- OpenAPI export → typed web client (`openapi-fetch`) with CI drift check
- Observability stub: nestjs-pino (JSON, redact `MONGODB_URI`), request logging interceptor, OTel noop

### Acceptance artifacts

- ADR-001: shared MongoDB with legacy ([`docs/adr/001-shared-mongodb-with-legacy.md`](docs/adr/001-shared-mongodb-with-legacy.md))
- Foundation checklist ([`docs/track-foundation-acceptance.md`](docs/track-foundation-acceptance.md))
- Domain module recipe ([`docs/domain-module-recipe.md`](docs/domain-module-recipe.md))

After this tag, product work may add domain modules against legacy collections per the recipe (read-only by default; writes require a new ADR).
