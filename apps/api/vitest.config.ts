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
    coverage: {
      provider: 'v8',
      reportsDirectory: './coverage',
      include: [
        '**/examples/example.service.ts',
        '**/examples/example.repository.ts',
        '**/compat/mappers/**/*.ts',
        '**/auth/**/*.ts',
        '**/users/**/*.ts',
      ],
      exclude: [
        '**/*.{spec,test}.ts',
        '**/*.module.ts',
        '**/*.controller.ts',
        '**/*.dto.ts',
        '**/*.decorator.ts',
        '**/bootstrap-admin.cli.ts',
      ],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
      },
    },
  },
});
