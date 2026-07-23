# Track 19 — Quality Expansion freeze checklist

Closes **T19** (steps **175–182**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                    | Status | Evidence                                                                                                                                       |
| ---- | ------------------------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| 175  | API coverage include     | done   | [`apps/api/vitest.config.ts`](../apps/api/vitest.config.ts) — auth/users include; Nest wiring/CLI excluded                                     |
| 176  | Web coverage include     | done   | [`apps/web/vitest.config.ts`](../apps/web/vitest.config.ts) — `lib/auth/**`; [`use-auth.test.tsx`](../apps/web/src/lib/auth/use-auth.test.tsx) |
| 177  | Playwright scaffold      | done   | [`apps/web-e2e`](../apps/web-e2e) — project + `playwright.config.ts` + smoke                                                                   |
| 178  | Login e2e spec           | done   | [`apps/web-e2e/src/login.spec.ts`](../apps/web-e2e/src/login.spec.ts) — bootstrap → `/examples/new`                                            |
| 179  | testing.md Playwright    | done   | [`testing.md`](testing.md)#playwright-web-e2e; README link                                                                                     |
| 180  | CI Playwright job        | done   | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml) job `playwright` (ubuntu + mongo)                                                    |
| 181  | branch-protection update | done   | [`branch-protection.md`](branch-protection.md) lists `playwright` (enable in GitHub after first green run)                                     |
| 182  | T19 checklist            | done   | this file                                                                                                                                      |

## Verification

```bash
npx nx run api:test
npx nx run web:test
# with Mongo + api + web + bootstrap-admin:
npx nx run web-e2e:e2e
```

## Related

- Previous: [`track-18-feature-flags-freeze.md`](track-18-feature-flags-freeze.md)
- Next track: **T20 — Observability Production** (183–190) — closed in [`track-20-observability-production-freeze.md`](track-20-observability-production-freeze.md)
- Ops: [`testing.md`](testing.md), [`branch-protection.md`](branch-protection.md)
