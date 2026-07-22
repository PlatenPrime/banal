/**
 * Builds Nest API, then writes apps/api/openapi/openapi.json via the export CLI.
 * Usage (repo root): `npm run openapi:export`
 */
/* global console, process */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const apiDir = join(rootDir, 'apps', 'api');
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
  run(process.execPath, [nestJs, 'build'], apiDir);
  run(process.execPath, [cliEntry], apiDir);
} catch (error) {
  console.error('[openapi:export]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
