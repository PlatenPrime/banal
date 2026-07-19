/**
 * Pre-push gate: full workspace typecheck.
 */
/* global console, process */
import { execSync } from 'node:child_process';

console.log('[husky] pre-push: typecheck');
try {
  execSync('npm run typecheck', { stdio: 'inherit' });
} catch {
  process.exit(1);
}
process.exit(0);
