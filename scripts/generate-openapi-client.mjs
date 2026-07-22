/**
 * Generates TypeScript types from the committed OpenAPI JSON.
 * Usage (repo root): `npm run openapi:generate`
 *
 * Do not edit apps/web/src/lib/api/generated/* by hand — regenerate instead.
 */
/* global console, process */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdirSync } from 'node:fs';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const openapiJson = join(rootDir, 'apps', 'api', 'openapi', 'openapi.json');
const outDir = join(rootDir, 'apps', 'web', 'src', 'lib', 'api', 'generated');
const outFile = join(outDir, 'schema.d.ts');
const bin = join(rootDir, 'node_modules', 'openapi-typescript', 'bin', 'cli.js');

mkdirSync(outDir, { recursive: true });

const result = spawnSync(process.execPath, [bin, openapiJson, '-o', outFile], {
  cwd: rootDir,
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
  console.error('[openapi:generate]', result.error.message);
  process.exitCode = 1;
} else if (result.status !== 0) {
  console.error(`[openapi:generate] exited with code ${result.status ?? 'unknown'}`);
  process.exitCode = 1;
} else {
  console.log(`OpenAPI types written to ${outFile}`);
}
