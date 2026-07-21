import { existsSync } from 'node:fs';
import path from 'node:path';

const REQUIRED_RELATIVE_PATHS = ['.output/server/index.mjs', '.output/public'] as const;

/**
 * Verifies TanStack Start / Nitro production artifacts after `vite build`.
 */
export function assertWebBuildOutput(webRoot: string): void {
  for (const relativePath of REQUIRED_RELATIVE_PATHS) {
    const absolutePath = path.join(webRoot, relativePath);
    if (!existsSync(absolutePath)) {
      throw new Error(`Web build smoke failed: missing ${relativePath} under ${webRoot}`);
    }
  }
}

export function requiredWebBuildPaths(): readonly string[] {
  return REQUIRED_RELATIVE_PATHS;
}
