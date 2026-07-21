/* global console, process */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const required = ['.output/server/index.mjs', '.output/public'];

for (const relativePath of required) {
  const absolutePath = path.join(webRoot, relativePath);
  if (!existsSync(absolutePath)) {
    console.error(`Web build smoke failed: missing ${relativePath} under ${webRoot}`);
    process.exit(1);
  }
}

console.log('Web build smoke OK:', required.join(', '));
