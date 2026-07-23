# Branch protection (GitHub)

Required status checks for merges into `main`. Apply these in the GitHub UI — this file is the checklist, not automation.

## Required checks

| Check name (Actions)       | Job / matrix                                    | Why                                                        |
| -------------------------- | ----------------------------------------------- | ---------------------------------------------------------- |
| `quality (ubuntu-latest)`  | [ci.yml](../.github/workflows/ci.yml) `quality` | Linux gates: format, lint, typecheck, build, unit, openapi |
| `quality (windows-latest)` | same workflow, Windows matrix                   | Cross-platform parity                                      |
| `e2e`                      | ubuntu-only job + `mongo:7` service             | API e2e against isolated Mongo                             |
| `playwright`               | ubuntu-only job + `mongo:7` + api + web         | Browser login e2e (`apps/web-e2e`)                         |

Exact check names must match the job `name:` fields in `.github/workflows/ci.yml`.

## Enabled

- Date: **2026-07-22** (initial); **playwright** added with T19 (2026-07-23) — enable in GitHub after first green run
- Branch: `main`
- Required checks: `quality (ubuntu-latest)`, `quality (windows-latest)`, `e2e`, `playwright`
- Require PR before merging: yes
- Require branches up to date: yes
- Enforce for admins: yes
- Verified via GitHub API (`gh api repos/PlatenPrime/banal/branches/main/protection`)

## Settings checklist (repo admin)

1. **Settings → Branches → Add/Edit branch protection rule** for `main`.
2. Enable **Require a pull request before merging** (team preference).
3. Enable **Require status checks to pass before merging**.
4. Enable **Require branches to be up to date before merging**.
5. Add the four required checks listed above (including `playwright` after it appears in Actions).
6. Do **not** allow bypassing required checks for routine merges (admins: only emergency).
7. Do **not** use `continue-on-error` on quality/e2e/playwright steps in the workflow.

## Related

- Local vs CI parity: [LOCAL_SETUP.md](./LOCAL_SETUP.md#local-vs-github-actions-parity)
- Testing norms: [testing.md](./testing.md)
- Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
