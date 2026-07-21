import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { assertWebBuildOutput } from './lib/assert-web-build-output';

const webRoot = path.dirname(fileURLToPath(new URL('.', import.meta.url)));
const viteCli = path.resolve(webRoot, '../../node_modules/vite/bin/vite.js');

describe('web production build smoke', () => {
  it('vite build produces SSR nitro server entry', () => {
    const result = spawnSync(process.execPath, [viteCli, 'build'], {
      cwd: webRoot,
      env: {
        ...process.env,
        VITE_API_URL: process.env.VITE_API_URL ?? 'http://localhost:4000',
      },
      encoding: 'utf8',
    });

    expect(result.status, result.stderr || result.stdout).toBe(0);
    expect(() => assertWebBuildOutput(webRoot)).not.toThrow();
  }, 120_000);
});
