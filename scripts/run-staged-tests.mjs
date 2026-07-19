/**
 * Run unit tests for Nx projects touched by staged files (step 022).
 */
/* global console, process */
import { execSync } from 'node:child_process';

const normalizePath = (p) => p.replaceAll('\\', '/');

const getStagedFiles = () =>
  execSync('git diff --cached --name-only --diff-filter=ACMR', {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'ignore'],
  })
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map(normalizePath);

/** @type {{ prefix: string, project: string }[]} */
const PROJECT_MAP = [
  { prefix: 'apps/api/', project: 'api' },
  { prefix: 'apps/web/', project: 'web' },
  { prefix: 'libs/shared-contracts/', project: 'shared-contracts' },
];

const resolveProjects = (files) => {
  const projects = new Set();
  for (const file of files) {
    for (const { prefix, project } of PROJECT_MAP) {
      if (file.startsWith(prefix)) {
        projects.add(project);
      }
    }
  }
  return [...projects].sort();
};

const main = () => {
  let files;
  try {
    files = getStagedFiles();
  } catch (error) {
    console.error('[run-staged-tests] Failed to read staged files:', error.message);
    process.exit(1);
  }

  const projects = resolveProjects(files);
  if (projects.length === 0) {
    console.log('[run-staged-tests] No app/lib projects in staged files — skip');
    process.exit(0);
  }

  const projectList = projects.join(',');
  console.log(`[run-staged-tests] Running unit tests for: ${projectList}`);

  try {
    execSync(`npx nx run-many -t test --projects=${projectList}`, {
      stdio: 'inherit',
    });
  } catch {
    process.exit(1);
  }

  process.exit(0);
};

main();
