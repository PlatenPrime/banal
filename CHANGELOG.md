# Changelog

All notable changes to this project are documented in this file.

## Tag rules

- Baseline freezes use **annotated** git tags: `foundation-vX.Y.Z`, later `platform-vX.Y.Z`.
- Each freeze tag must have a matching section in this file before the tag is created.
- **Do not** rewrite, delete, or force-move a tag that already exists on `origin`.
- Push tags explicitly (`git push origin refs/tags/<name>`); do not rely on accidental `--tags` from unrelated pushes.

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
