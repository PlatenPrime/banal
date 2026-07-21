/**
 * Self-tests for tests-first gate (step 073).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  evaluateFiles,
  isApiProduction,
  isApiUnitTest,
  resolveCiRange,
} from './validate-tests-first.mjs';

describe('evaluateFiles', () => {
  it('passes on an empty file list', () => {
    const result = evaluateFiles([]);
    assert.equal(result.ok, true);
    assert.deepEqual(result.failures, []);
  });

  it('fails when API production has no unit test', () => {
    const result = evaluateFiles(['apps/api/src/examples/example.service.ts']);
    assert.equal(result.ok, false);
    assert.equal(result.failures.length, 1);
    assert.equal(result.failures[0].label, 'API');
  });

  it('passes when API production is paired with a unit test', () => {
    const result = evaluateFiles([
      'apps/api/src/examples/example.service.ts',
      'apps/api/src/examples/example.service.spec.ts',
    ]);
    assert.equal(result.ok, true);
  });

  it('does not treat e2e specs as satisfying the API unit gate', () => {
    assert.equal(isApiUnitTest('apps/api/test/examples.e2e-spec.ts'), false);
    assert.equal(isApiProduction('apps/api/src/examples/example.service.ts'), true);

    const result = evaluateFiles([
      'apps/api/src/examples/example.service.ts',
      'apps/api/test/examples.e2e-spec.ts',
    ]);
    assert.equal(result.ok, false);
    assert.equal(result.failures[0].label, 'API');
  });

  it('fails when Web production has no unit test', () => {
    const result = evaluateFiles(['apps/web/src/lib/api-client/client.ts']);
    assert.equal(result.ok, false);
    assert.equal(result.failures[0].label, 'Web');
  });

  it('passes when Web production is paired with a unit test', () => {
    const result = evaluateFiles([
      'apps/web/src/lib/api-client/client.ts',
      'apps/web/src/lib/api-client/client.test.ts',
    ]);
    assert.equal(result.ok, true);
  });

  it('fails when Contracts production has no unit test', () => {
    const result = evaluateFiles(['libs/shared-contracts/src/problem-details.ts']);
    assert.equal(result.ok, false);
    assert.equal(result.failures[0].label, 'Contracts');
  });

  it('passes when Contracts production is paired with a unit test', () => {
    const result = evaluateFiles([
      'libs/shared-contracts/src/problem-details.ts',
      'libs/shared-contracts/src/problem-details.spec.ts',
    ]);
    assert.equal(result.ok, true);
  });

  it('normalizes Windows path separators', () => {
    const result = evaluateFiles([
      'apps\\api\\src\\examples\\example.service.ts',
      'apps\\api\\src\\examples\\example.service.spec.ts',
    ]);
    assert.equal(result.ok, true);
  });
});

describe('resolveCiRange', () => {
  it('prefers an explicit --range value', () => {
    assert.equal(resolveCiRange('abc...def', {}), 'abc...def');
  });

  it('uses PR base ref when GITHUB_BASE_REF and GITHUB_SHA are set', () => {
    assert.equal(
      resolveCiRange(null, { GITHUB_BASE_REF: 'main', GITHUB_SHA: 'deadbeef' }),
      'origin/main...deadbeef',
    );
  });

  it('uses push before/after SHAs when BEFORE_SHA is non-zero', () => {
    assert.equal(
      resolveCiRange(null, {
        BEFORE_SHA: '1111111111111111111111111111111111111111',
        GITHUB_SHA: '2222222222222222222222222222222222222222',
      }),
      '1111111111111111111111111111111111111111...2222222222222222222222222222222222222222',
    );
  });

  it('falls back to HEAD~1...HEAD', () => {
    assert.equal(resolveCiRange(null, {}), 'HEAD~1...HEAD');
  });
});
