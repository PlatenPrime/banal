import path from 'node:path';
import { fileURLToPath } from 'node:url';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    alias: {
      '@app/shared-contracts': path.resolve(webRoot, '../../libs/shared-contracts/src/index.ts'),
    },
    tsconfigPaths: true,
  },
  test: {
    environment: 'happy-dom',
    // Do not rely on gitignored `.env.test` — CI checkouts have no local env files.
    env: {
      VITE_API_URL: 'http://localhost:4000',
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/**/*.smoke.spec.ts', '.output/**', 'dist/**', 'node_modules/**'],
    pool: 'forks',
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: ['src/lib/api-client/**/*.ts', 'src/lib/query-client.ts', 'src/lib/auth/**/*.ts'],
      exclude: ['**/*.{spec,test}.{ts,tsx}'],
      thresholds: {
        lines: 75,
        branches: 70,
        functions: 75,
      },
    },
  },
});
