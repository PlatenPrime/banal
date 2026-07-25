# Track 25 — Runbooks & Freeze checklist

Closes **T25** (steps **237–246**) from [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md).

| Step | Title                 | Status | Evidence                                                                                           |
| ---- | --------------------- | ------ | -------------------------------------------------------------------------------------------------- |
| 237  | Deploy index          | done   | [`deploy/README.md`](deploy/README.md) — atlas/railway/vercel/cookies/T24 + ops runbooks table     |
| 238  | Platform acceptance   | done   | [`track-platform-acceptance.md`](track-platform-acceptance.md) — criteria filled; domains deferred |
| 239  | README links          | done   | Root [`README.md`](../README.md) → PLATFORM-ROADMAP, deploy, acceptance, domain recipe             |
| 240  | LOCAL_SETUP prod note | done   | [`LOCAL_SETUP.md`](LOCAL_SETUP.md)#local-vs-deployed                                               |
| 241  | CHANGELOG entry       | done   | [`CHANGELOG.md`](../CHANGELOG.md) — `[platform-v1.0.0]`                                            |
| 242  | Anti-goals confirm    | done   | Listed in acceptance + CHANGELOG; matches roadmap § Anti-goals                                     |
| 243  | Domain recipe pointer | done   | README + acceptance Related + CHANGELOG → [`domain-module-recipe.md`](domain-module-recipe.md)     |
| 244  | Tag `platform-v1.0.0` | done   | Annotated tag (local)                                                                              |
| 245  | Push tag              | done   | `git push origin platform-v1.0.0`                                                                  |
| 246  | Progress close        | done   | [PLATFORM-ROADMAP.md](PLATFORM-ROADMAP.md) — T11–T25 `done`, 150/150                               |

## Owner gates (post-tag, not blockers)

| Gate                                         | Done | Notes                                 |
| -------------------------------------------- | ---- | ------------------------------------- |
| Live custom domains + `SameSite=Lax` cutover | ☐    | T23; until then interim prod URLs     |
| Actions Deploy smoke → `staging` green       | ☐    | After merge to `main`; see T24 freeze |

## Related

- Acceptance: [`track-platform-acceptance.md`](track-platform-acceptance.md)
- Previous: [`track-24-cicd-deploy-automation-freeze.md`](track-24-cicd-deploy-automation-freeze.md)
- Next: domain modules via [`domain-module-recipe.md`](domain-module-recipe.md)
