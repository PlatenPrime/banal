/* global console, process */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * @param {NodeJS.ProcessEnv} [env]
 * @returns {'nitro' | 'vercel'}
 */
function resolveWebBuildTarget(env = process.env) {
  const value = env.VERCEL?.trim().toLowerCase();
  if (value === '1' || value === 'true') {
    return 'vercel';
  }
  return 'nitro';
}

/** @type {Record<'nitro' | 'vercel', readonly string[]>} */
const PATHS_BY_TARGET = {
  nitro: ['.output/server/index.mjs', '.output/public'],
  vercel: ['.vercel/output/config.json', '.vercel/output/static'],
};

const target = resolveWebBuildTarget();
const required = PATHS_BY_TARGET[target];

for (const relativePath of required) {
  const absolutePath = path.join(webRoot, relativePath);
  if (!existsSync(absolutePath)) {
    console.error(
      `Web build smoke failed: missing ${relativePath} under ${webRoot} (target=${target})`,
    );
    process.exit(1);
  }
}

console.log(`Web build smoke OK (target=${target}):`, required.join(', '));
