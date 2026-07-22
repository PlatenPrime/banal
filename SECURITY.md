# Security Policy

## Supported versions

| Version / baseline                     | Supported |
| -------------------------------------- | --------- |
| `foundation-v1.0.0`+ on `main` / `dev` | Yes       |
| Older untagged commits                 | No        |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Prefer one of:

1. **GitHub Security Advisories** — [Report a vulnerability](https://github.com/PlatenPrime/banal/security/advisories/new) on this repository (private disclosure).
2. If advisories are unavailable, contact the repository owner (**@PlatenPrime**) via a private channel and include:
   - a short description of the issue and impact
   - steps to reproduce or a proof of concept
   - affected paths / versions if known

We aim to acknowledge reports within **7 days** and to share a remediation plan or fix timeline after triage.

## Scope notes

- Secrets must never land in the repo, Vite client bundles, or public docs. See [docs/ops/secrets-checklist.md](docs/ops/secrets-checklist.md) and [docs/ops/environments.md](docs/ops/environments.md).
- Dependency updates are managed via Dependabot (`.github/dependabot.yml`).
