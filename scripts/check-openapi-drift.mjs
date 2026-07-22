/**
 * Regenerates OpenAPI JSON + typed client, then fails if working tree drifted.
 * Usage (repo root): `npm run openapi:check`
 *
 * Artifacts must be in the git index (`git add`) or already committed. After regen,
 * there must be no unstaged changes on those paths.
 *
 * Set `OPENAPI_CHECK_SKIP_REGEN=1` to only run the git gate (used by self-tests).
 */
/* global console, process */
import { spawnSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');

const trackedPaths = [
  'apps/api/openapi/openapi.json',
  'apps/web/src/lib/api/generated/schema.d.ts',
  'apps/web/src/lib/api/generated/index.ts',
];

/**
 * @param {string} scriptRelativePath
 */
function runNodeScript(scriptRelativePath) {
  const result = spawnSync(process.execPath, [join(rootDir, scriptRelativePath)], {
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
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${scriptRelativePath} exited with code ${result.status ?? 'unknown'}`);
  }
}

/**
 * @param {string[]} args
 */
function runGit(args) {
  const result = spawnSync('git', args, {
    cwd: rootDir,
    env: process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw result.error;
  }

  return result;
}

try {
  const skipRegen = process.env.OPENAPI_CHECK_SKIP_REGEN === '1';

  if (!skipRegen) {
    runNodeScript('scripts/export-openapi.mjs');
    runNodeScript('scripts/generate-openapi-client.mjs');
  }

  const missing = trackedPaths.filter((relativePath) => {
    const listed = runGit(['ls-files', '--', relativePath]);
    return listed.status !== 0 || !(listed.stdout ?? '').trim();
  });

  if (missing.length > 0) {
    console.error('[openapi:check] OpenAPI artifacts are not in the git index. Run:');
    console.error('  npm run openapi:export');
    console.error('  npm run openapi:generate');
    console.error('  git add ' + missing.join(' '));
    process.exitCode = 1;
  } else {
    const diff = runGit(['diff', '--', ...trackedPaths]);
    if (diff.status !== 0) {
      throw new Error(`git diff failed: ${diff.stderr || diff.stdout}`);
    }

    const changed = (diff.stdout ?? '').trim();
    if (changed.length > 0) {
      console.error('[openapi:check] OpenAPI artifacts are out of date. Re-run:');
      console.error('  npm run openapi:export');
      console.error('  npm run openapi:generate');
      console.error('Then commit the updated files.\n');
      console.error(changed);
      process.exitCode = 1;
    } else {
      console.log('[openapi:check] OpenAPI artifacts are up to date.');
    }
  }
} catch (error) {
  console.error('[openapi:check]', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
