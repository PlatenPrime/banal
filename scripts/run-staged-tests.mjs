/**
 * Run unit tests for Nx projects affected by staged files (step 074).
 * Uses graph-aware `nx affected --files` (supersedes path-only run-many from 022).
 */
/* global console, process */
import { execSync } from 'node:child_process';

export const normalizePath = (p) => p.replaceAll('\\', '/');

/**
 * Files that can change the Nx project graph for pre-commit unit tests.
 * Docs/scripts/misc paths are excluded so we skip without invoking Nx.
 *
 * @param {string} file
 */
export const isWorkspaceGraphFile = (file) => {
  const n = normalizePath(file);
  return (
    n.startsWith('apps/') ||
    n.startsWith('libs/') ||
    n === 'package.json' ||
    n === 'package-lock.json' ||
    n === 'nx.json' ||
    n === 'tsconfig.base.json'
  );
};

/**
 * @param {string[]} files
 * @returns {string[]}
 */
export const filterGraphFiles = (files) =>
  [...new Set(files.map(normalizePath).filter(isWorkspaceGraphFile))].sort();

/**
 * Build the nx affected unit-test command, or null when there is nothing to run.
 *
 * @param {string[]} files staged (or candidate) paths
 * @returns {string | null}
 */
export const buildAffectedTestCommand = (files) => {
  const graphFiles = filterGraphFiles(files);
  if (graphFiles.length === 0) {
    return null;
  }

  const filesArg = graphFiles.map((f) => (/\s/.test(f) ? `"${f}"` : f)).join(',');
  return `npx nx affected -t test --files=${filesArg}`;
};

export const getStagedFiles = () =>
  execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizePath);

const main = () => {
  let files;
  try {
    files = getStagedFiles();
  } catch (error) {
    console.error('[run-staged-tests] Failed to read staged files:', error.message);
    process.exit(1);
  }

  const command = buildAffectedTestCommand(files);
  if (!command) {
    console.log('[run-staged-tests] No workspace graph files in staged set — skip');
    process.exit(0);
  }

  const graphFiles = filterGraphFiles(files);
  console.log(
    `[run-staged-tests] Running affected unit tests for staged files (${graphFiles.length}):`,
  );
  for (const file of graphFiles) {
    console.log(`  - ${file}`);
  }

  try {
    execSync(command, { stdio: 'inherit' });
  } catch {
    process.exit(1);
  }

  process.exit(0);
};

const isDirectRun =
  Boolean(process.argv[1]) &&
  normalizePath(process.argv[1]).endsWith('scripts/run-staged-tests.mjs');

if (isDirectRun) {
  main();
}
