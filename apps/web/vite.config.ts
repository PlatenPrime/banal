import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import { defineConfig } from 'vite';
import viteReact from '@vitejs/plugin-react';
import { nitro } from 'nitro/vite';

const webRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  server: {
    port: 3000,
    strictPort: true,
  },
  resolve: {
    alias: {
      '@app/shared-contracts': path.resolve(webRoot, '../../libs/shared-contracts/src/index.ts'),
    },
    tsconfigPaths: true,
  },
  plugins: [tanstackStart({ srcDirectory: 'src' }), nitro(), viteReact()],
});
