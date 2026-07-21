import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [viteReact()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['src/**/*.smoke.spec.ts', '.output/**', 'dist/**', 'node_modules/**'],
    pool: 'forks',
    setupFiles: ['./vitest.setup.ts'],
  },
});
