/**
 * Tests-first gate (steps 021 / 073). Spec: docs/FOUNDATION-ROADMAP.md §20.
 *
 * Default (pre-commit): staged ACMR files.
 * --ci: git diff over a resolved range.
 */
/* global console, process */
import { execSync } from 'node:child_process';

export const normalizePath = (p) => p.replaceAll('\\', '/');

const getGitDiffFiles = (command) =>
  execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizePath);

/** Generated OpenAPI client + `*.gen.ts(x)` — not hand-written production. */
export const isGeneratedSource = (file) =>
  file.endsWith('.gen.ts') ||
  file.endsWith('.gen.tsx') ||
  file.startsWith('apps/web/src/lib/api/generated/');

export const isApiUnitTest = (file) =>
  file.startsWith('apps/api/') &&
  (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) &&
  !file.endsWith('.e2e-spec.ts');

export const isApiProduction = (file) =>
  file.startsWith('apps/api/src/') && !isApiUnitTest(file) && !isGeneratedSource(file);

export const isWebUnitTest = (file) =>
  file.startsWith('apps/web/') && /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(file);

export const isWebProduction = (file) =>
  file.startsWith('apps/web/src/') && !isWebUnitTest(file) && !isGeneratedSource(file);

export const isContractsUnitTest = (file) =>
  file.startsWith('libs/shared-contracts/') &&
  (file.endsWith('.spec.ts') || file.endsWith('.test.ts'));

export const isContractsProduction = (file) =>
  file.startsWith('libs/shared-contracts/src/') && !isContractsUnitTest(file);

/**
 * @param {string[]} argv
 * @returns {{ isCi: boolean, range: string | null }}
 */
export const parseArgs = (argv) => {
  let isCi = false;
  let range = null;
  for (const arg of argv) {
    if (arg === '--ci') {
      isCi = true;
    } else if (arg.startsWith('--range=')) {
      range = arg.slice('--range='.length);
      isCi = true;
    }
  }
  return { isCi, range };
};

/**
 * Resolve CI diff range. Priority:
 * 1. --range=BASE...HEAD
 * 2. PR: origin/$GITHUB_BASE_REF...$GITHUB_SHA
 * 3. push: $BEFORE_SHA...$GITHUB_SHA (non-zero BEFORE_SHA)
 * 4. HEAD~1...HEAD
 *
 * @param {string | null | undefined} explicitRange
 * @param {NodeJS.ProcessEnv} [env]
 */
export const resolveCiRange = (explicitRange, env = process.env) => {
  if (explicitRange) {
    return explicitRange;
  }

  const baseRef = env.GITHUB_BASE_REF;
  const sha = env.GITHUB_SHA;
  if (baseRef && sha) {
    return `origin/${baseRef}...${sha}`;
  }

  const before = env.BEFORE_SHA;
  const zero = '0000000000000000000000000000000000000000';
  if (before && before !== zero && sha) {
    return `${before}...${sha}`;
  }

  return 'HEAD~1...HEAD';
};

const getFiles = (isCi, explicitRange) => {
  if (!isCi) {
    return getGitDiffFiles('git diff --cached --name-only --diff-filter=ACMR');
  }

  const range = resolveCiRange(explicitRange);
  return getGitDiffFiles(`git diff --name-only --diff-filter=ACMR ${range}`);
};

/**
 * @param {string} label
 * @param {string[]} production
 * @param {string[]} tests
 * @param {{ label: string, production: string[] }[]} failures
 */
const checkPair = (label, production, tests, failures) => {
  if (production.length === 0) {
    return;
  }
  if (tests.length > 0) {
    return;
  }
  failures.push({ label, production });
};

/**
 * Classify and evaluate a file list. Pure — no git I/O.
 *
 * @param {string[]} files
 * @returns {{ ok: boolean, failures: { label: string, production: string[] }[] }}
 */
export const evaluateFiles = (files) => {
  const normalized = files.map(normalizePath);

  const apiProd = normalized.filter(isApiProduction);
  const apiTests = normalized.filter(isApiUnitTest);
  const webProd = normalized.filter(isWebProduction);
  const webTests = normalized.filter(isWebUnitTest);
  const contractsProd = normalized.filter(isContractsProduction);
  const contractsTests = normalized.filter(isContractsUnitTest);

  /** @type {{ label: string, production: string[] }[]} */
  const failures = [];
  checkPair('API', apiProd, apiTests, failures);
  checkPair('Web', webProd, webTests, failures);
  checkPair('Contracts', contractsProd, contractsTests, failures);

  return { ok: failures.length === 0, failures };
};

const printFailure = (failures) => {
  console.error('[validate-tests-first] Tests-first gate failed.\n');
  for (const { label, production } of failures) {
    console.error(`${label} production changes require ≥1 unit test in the same commit/PR:`);
    for (const file of production.slice(0, 20)) {
      console.error(`  - ${file}`);
    }
    if (production.length > 20) {
      console.error(`  … and ${production.length - 20} more`);
    }
    console.error('');
  }
  console.error(
    'Add a matching unit test (*.spec.ts / *.test.ts[x]). E2E specs (*.e2e-spec.ts) do not satisfy this gate.',
  );
};

const main = () => {
  const { isCi, range } = parseArgs(process.argv.slice(2));

  let files;
  try {
    files = getFiles(isCi, range);
  } catch (error) {
    console.error('[validate-tests-first] Failed to read git diff:', error.message);
    process.exit(1);
  }

  if (files.length === 0) {
    process.exit(0);
  }

  const { ok, failures } = evaluateFiles(files);

  if (!ok) {
    printFailure(failures);
    process.exit(1);
  }

  process.exit(0);
};

const isDirectRun =
  Boolean(process.argv[1]) &&
  normalizePath(process.argv[1]).endsWith('scripts/validate-tests-first.mjs');

if (isDirectRun) {
  main();
}
