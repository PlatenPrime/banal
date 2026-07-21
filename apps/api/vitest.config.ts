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
    include: ['src/**/*.{spec,test}.ts'],
    exclude: ['dist/**', 'node_modules/**', '**/*.e2e-spec.ts'],
    pool: 'forks',
  },
});
