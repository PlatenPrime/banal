/**
 * Tests-first gate (step 021). Spec: docs/FOUNDATION-ROADMAP.md §20.
 *
 * Default (pre-commit): staged ACMR files.
 * --ci: git diff over a resolved range.
 */
/* global console, process */
import { execSync } from 'node:child_process';

const normalizePath = (p) => p.replaceAll('\\', '/');

const getGitDiffFiles = (command) =>
  execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizePath);

const isGeneratedSource = (file) => file.endsWith('.gen.ts') || file.endsWith('.gen.tsx');

const isApiUnitTest = (file) =>
  file.startsWith('apps/api/') &&
  (file.endsWith('.spec.ts') || file.endsWith('.test.ts')) &&
  !file.endsWith('.e2e-spec.ts');

const isApiProduction = (file) =>
  file.startsWith('apps/api/src/') && !isApiUnitTest(file) && !isGeneratedSource(file);

const isWebUnitTest = (file) =>
  file.startsWith('apps/web/') && /\.(spec|test)\.(ts|tsx|js|jsx)$/.test(file);

const isWebProduction = (file) =>
  file.startsWith('apps/web/src/') && !isWebUnitTest(file) && !isGeneratedSource(file);

const isContractsUnitTest = (file) =>
  file.startsWith('libs/shared-contracts/') &&
  (file.endsWith('.spec.ts') || file.endsWith('.test.ts'));

const isContractsProduction = (file) =>
  file.startsWith('libs/shared-contracts/src/') && !isContractsUnitTest(file);

/**
 * @param {string[]} argv
 * @returns {{ isCi: boolean, range: string | null }}
 */
const parseArgs = (argv) => {
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
 */
const resolveCiRange = (explicitRange) => {
  if (explicitRange) {
    return explicitRange;
  }

  const baseRef = process.env.GITHUB_BASE_REF;
  const sha = process.env.GITHUB_SHA;
  if (baseRef && sha) {
    return `origin/${baseRef}...${sha}`;
  }

  const before = process.env.BEFORE_SHA;
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
 * @param {string[]} failures
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

  const apiProd = files.filter(isApiProduction);
  const apiTests = files.filter(isApiUnitTest);
  const webProd = files.filter(isWebProduction);
  const webTests = files.filter(isWebUnitTest);
  const contractsProd = files.filter(isContractsProduction);
  const contractsTests = files.filter(isContractsUnitTest);

  /** @type {{ label: string, production: string[] }[]} */
  const failures = [];
  checkPair('API', apiProd, apiTests, failures);
  checkPair('Web', webProd, webTests, failures);
  checkPair('Contracts', contractsProd, contractsTests, failures);

  if (failures.length > 0) {
    printFailure(failures);
    process.exit(1);
  }

  process.exit(0);
};

main();
