#!/usr/bin/env bash
# Thin wrapper around smoke-api.mjs for Unix / Git Bash.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
exec node "$ROOT/scripts/smoke-api.mjs" "$@"
