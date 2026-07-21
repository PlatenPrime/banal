# Branch protection (GitHub)

Required status checks for merges into `main`. Apply these in the GitHub UI — this file is the checklist, not automation.

## Required checks

| Check name (Actions)       | Job / matrix                                    | Why                                               |
| -------------------------- | ----------------------------------------------- | ------------------------------------------------- |
| `quality (ubuntu-latest)`  | [ci.yml](../.github/workflows/ci.yml) `quality` | Linux gates: format, lint, typecheck, build, unit |
| `quality (windows-latest)` | same workflow, Windows matrix                   | Cross-platform parity                             |
| `e2e`                      | ubuntu-only job + `mongo:7` service             | API e2e against isolated Mongo                    |

Exact check names must match the job `name:` fields in `.github/workflows/ci.yml`.

## Settings checklist (repo admin)

1. **Settings → Branches → Add/Edit branch protection rule** for `main`.
2. Enable **Require a pull request before merging** (team preference).
3. Enable **Require status checks to pass before merging**.
4. Enable **Require branches to be up to date before merging**.
5. Add the three required checks listed above.
6. Do **not** allow bypassing required checks for routine merges (admins: only emergency).
7. Do **not** use `continue-on-error` on quality/e2e steps in the workflow.

## Related

- Local vs CI parity: [LOCAL_SETUP.md](./LOCAL_SETUP.md#local-vs-github-actions-parity)
- Testing norms: [testing.md](./testing.md)
- Workflow: [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)
