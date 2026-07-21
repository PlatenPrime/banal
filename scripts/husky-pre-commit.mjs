/**
 * Pre-commit orchestrator (steps 019–022, 074).
 * Single entrypoint: lint-staged → tests-first → affected staged unit tests.
 */
/* global console, process */
import { execSync } from 'node:child_process';

const run = (label, command) => {
  console.log(`[husky] ${label}`);
  try {
    execSync(command, { stdio: 'inherit' });
  } catch {
    process.exit(1);
  }
};

run('lint-staged', 'npx lint-staged');
run('validate-tests-first', 'node scripts/validate-tests-first.mjs');
run('run-staged-tests', 'node scripts/run-staged-tests.mjs');

process.exit(0);
