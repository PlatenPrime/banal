/**
 * Self-tests for staged affected unit-test runner (step 074).
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildAffectedTestCommand,
  filterGraphFiles,
  isWorkspaceGraphFile,
  normalizePath,
} from './run-staged-tests.mjs';

describe('normalizePath', () => {
  it('converts Windows separators to posix', () => {
    assert.equal(normalizePath('apps\\api\\src\\main.ts'), 'apps/api/src/main.ts');
  });
});

describe('isWorkspaceGraphFile', () => {
  it('accepts apps, libs, and key workspace roots', () => {
    assert.equal(isWorkspaceGraphFile('apps/api/src/main.ts'), true);
    assert.equal(isWorkspaceGraphFile('libs/shared-contracts/src/index.ts'), true);
    assert.equal(isWorkspaceGraphFile('package.json'), true);
    assert.equal(isWorkspaceGraphFile('package-lock.json'), true);
    assert.equal(isWorkspaceGraphFile('nx.json'), true);
    assert.equal(isWorkspaceGraphFile('tsconfig.base.json'), true);
  });

  it('rejects docs, scripts, and unrelated roots', () => {
    assert.equal(isWorkspaceGraphFile('docs/LOCAL_SETUP.md'), false);
    assert.equal(isWorkspaceGraphFile('docs/FOUNDATION-ROADMAP.md'), false);
    assert.equal(isWorkspaceGraphFile('scripts/run-staged-tests.mjs'), false);
    assert.equal(isWorkspaceGraphFile('README.md'), false);
    assert.equal(isWorkspaceGraphFile('eslint.config.mjs'), false);
  });

  it('normalizes backslashes before matching', () => {
    assert.equal(isWorkspaceGraphFile('apps\\web\\src\\routes\\index.tsx'), true);
  });
});

describe('filterGraphFiles', () => {
  it('dedupes, normalizes, and sorts', () => {
    assert.deepEqual(
      filterGraphFiles([
        'libs\\shared-contracts\\src\\index.ts',
        'apps/api/src/main.ts',
        'docs/LOCAL_SETUP.md',
        'apps/api/src/main.ts',
      ]),
      ['apps/api/src/main.ts', 'libs/shared-contracts/src/index.ts'],
    );
  });
});

describe('buildAffectedTestCommand', () => {
  it('returns null for an empty file list', () => {
    assert.equal(buildAffectedTestCommand([]), null);
  });

  it('returns null for docs-only / non-graph staged files', () => {
    assert.equal(
      buildAffectedTestCommand(['docs/LOCAL_SETUP.md', 'scripts/husky-pre-commit.mjs']),
      null,
    );
  });

  it('builds nx affected -t test --files for contracts paths', () => {
    const command = buildAffectedTestCommand(['libs/shared-contracts/src/problem-details.ts']);
    assert.ok(command);
    assert.match(command, /^npx nx affected -t test --files=/);
    assert.match(command, /libs\/shared-contracts\/src\/problem-details\.ts/);
  });

  it('includes multiple graph files in --files', () => {
    const command = buildAffectedTestCommand([
      'apps/web/src/routes/index.tsx',
      'apps/api/src/main.ts',
    ]);
    assert.ok(command);
    assert.match(command, /apps\/api\/src\/main\.ts/);
    assert.match(command, /apps\/web\/src\/routes\/index\.tsx/);
  });

  it('quotes paths that contain spaces', () => {
    const command = buildAffectedTestCommand(['apps/api/src/my file.ts']);
    assert.equal(command, 'npx nx affected -t test --files="apps/api/src/my file.ts"');
  });
});
