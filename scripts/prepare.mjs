/**
 * Root `npm prepare`: install husky hooks locally, then patch Windows runners.
 * In CI (`CI=true` or `HUSKY=0`) skip entirely — hooks are not used on runners.
 */
/* global console, process */
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

if (process.env.CI === 'true' || process.env.HUSKY === '0') {
  process.exit(0);
}

try {
  const require = createRequire(import.meta.url);
  const huskyBin = require.resolve('husky/bin.js', { paths: [root] });
  const huskyResult = spawnSync(process.execPath, [huskyBin], {
    cwd: root,
    stdio: 'inherit',
  });
  if (huskyResult.status) {
    process.exit(huskyResult.status ?? 1);
  }
} catch (error) {
  console.warn(
    '[prepare] husky unavailable — skip:',
    error instanceof Error ? error.message : error,
  );
}

const patchResult = spawnSync(process.execPath, [join(root, 'scripts/patch-husky-runner.mjs')], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(patchResult.status ?? 0);
