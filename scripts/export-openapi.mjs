/**
 * Builds shared-contracts + Nest API, then writes apps/api/openapi/openapi.json.
 * Usage (repo root): `npm run openapi:export`
 *
 * shared-contracts must be built first: Nest resolves `@app/shared-contracts` via
 * package `dist/` exports, not tsconfig paths. CI docs-only runs skip affected
 * builds, so this script cannot assume `dist` already exists.
 *
 * Uses `tsc -b --force` (not `nx run …:build`) so a stale Nx cache cannot report
 * success when `libs/shared-contracts/dist` is missing on disk.
 */
/* global console, process */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(rootDir, 'apps', 'api');
const contractsDir = join(rootDir, 'libs', 'shared-contracts');
const tscJs = join(rootDir, 'node_modules', 'typescript', 'bin', 'tsc');
const nestJs = join(rootDir, 'node_modules', '@nestjs', 'cli', 'bin', 'nest.js');
const cliEntry = join(apiDir, 'dist', 'openapi', 'export-openapi.cli.js');

function run(command, args, cwd) {
  const result = spawnSync(command, args, {
    cwd,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }
  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`Command failed (${result.status}): ${command} ${args.join(' ')}`);
  }
}

try {
  run(process.execPath, [tscJs, '-b', 'tsconfig.json', '--force'], contractsDir);
  run(process.execPath, [nestJs, 'build'], apiDir);
  run(process.execPath, [cliEntry], apiDir);
} catch (error) {
  console.error('[openapi:export]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
