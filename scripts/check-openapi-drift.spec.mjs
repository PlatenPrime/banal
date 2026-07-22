/* global process */

import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const checkScript = join(rootDir, 'scripts', 'check-openapi-drift.mjs');
const schemaPath = join(rootDir, 'apps', 'web', 'src', 'lib', 'api', 'generated', 'schema.d.ts');

const artifactPaths = [
  'apps/api/openapi/openapi.json',
  'apps/web/src/lib/api/generated/schema.d.ts',
  'apps/web/src/lib/api/generated/index.ts',
];

/**
 * @param {NodeJS.ProcessEnv} [env]
 */
function runCheck(env = {}) {
  return spawnSync(process.execPath, [checkScript], {
    cwd: rootDir,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
}

function ensureArtifactsIndexed() {
  const add = spawnSync('git', ['add', '--', ...artifactPaths], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  assert.equal(add.status, 0, add.stderr || add.stdout);
}

describe('check-openapi-drift', () => {
  it('exits 0 when indexed artifacts match the regenerated output', () => {
    ensureArtifactsIndexed();
    const result = runCheck();
    assert.equal(result.status, 0, result.stderr || result.stdout);
    assert.match(result.stdout ?? '', /up to date/i);
  });

  it('exits 1 when generated schema has unstaged drift (skip regen)', () => {
    ensureArtifactsIndexed();
    const original = readFileSync(schemaPath, 'utf8');

    try {
      writeFileSync(schemaPath, `${original}\n// intentional-drift\n`, 'utf8');
      const result = runCheck({ OPENAPI_CHECK_SKIP_REGEN: '1' });
      assert.equal(result.status, 1, result.stderr || result.stdout);
      assert.match(result.stderr ?? '', /out of date/i);
    } finally {
      writeFileSync(schemaPath, original, 'utf8');
    }
  });
});
