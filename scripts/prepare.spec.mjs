/**
 * Self-tests for scripts/prepare.mjs CI skip behavior.
 */
/* global process */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { describe, it } from 'node:test';
import { fileURLToPath } from 'node:url';

const prepareScript = join(dirname(fileURLToPath(import.meta.url)), 'prepare.mjs');

describe('prepare.mjs', () => {
  it('exits 0 immediately when CI=true', () => {
    const result = spawnSync(process.execPath, [prepareScript], {
      env: { ...process.env, CI: 'true', HUSKY: undefined },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });

  it('exits 0 immediately when HUSKY=0', () => {
    const result = spawnSync(process.execPath, [prepareScript], {
      env: { ...process.env, CI: undefined, HUSKY: '0' },
      encoding: 'utf8',
    });
    assert.equal(result.status, 0, result.stderr || result.stdout);
  });
});
