import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.{spec,test}.ts'],
    exclude: ['test/**', 'dist/**', 'node_modules/**'],
  },
});
