import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
  // unplugin-swc disables esbuild; Oxc must be off too (Vite 8+ / Vitest 4).
  oxc: false,
  test: {
    environment: 'node',
    include: ['test/**/*.e2e-spec.ts'],
    exclude: ['dist/**', 'node_modules/**'],
    pool: 'forks',
    fileParallelism: false,
    maxWorkers: 1,
    testTimeout: 60_000,
  },
});
