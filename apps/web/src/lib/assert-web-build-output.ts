import { existsSync } from 'node:fs';
import path from 'node:path';

export type WebBuildTarget = 'nitro' | 'vercel';

const NITRO_REQUIRED_PATHS = ['.output/server/index.mjs', '.output/public'] as const;
const VERCEL_REQUIRED_PATHS = ['.vercel/output/config.json', '.vercel/output/static'] as const;

const PATHS_BY_TARGET: Record<WebBuildTarget, readonly string[]> = {
  nitro: NITRO_REQUIRED_PATHS,
  vercel: VERCEL_REQUIRED_PATHS,
};

/**
 * Resolves the expected Nitro / Vercel build artifact layout.
 * Vercel sets `VERCEL=1` during platform builds; local builds stay on the nitro node preset.
 */
export function resolveWebBuildTarget(
  env: NodeJS.ProcessEnv | Record<string, string | undefined> = process.env,
): WebBuildTarget {
  const value = env.VERCEL?.trim().toLowerCase();
  if (value === '1' || value === 'true') {
    return 'vercel';
  }
  return 'nitro';
}

/**
 * Paths that must exist after `vite build` for the given deployment target.
 */
export function requiredWebBuildPaths(
  target: WebBuildTarget = resolveWebBuildTarget(),
): readonly string[] {
  return PATHS_BY_TARGET[target];
}

/**
 * Verifies TanStack Start / Nitro production artifacts after `vite build`.
 */
export function assertWebBuildOutput(
  webRoot: string,
  target: WebBuildTarget = resolveWebBuildTarget(),
): void {
  for (const relativePath of requiredWebBuildPaths(target)) {
    const absolutePath = path.join(webRoot, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(
        `Web build smoke failed: missing ${relativePath} under ${webRoot} (target=${target})`,
      );
    }
  }
}
