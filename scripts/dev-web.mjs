/**
 * Dev wrapper for Vite / TanStack Start:
 * - frees port 3000 before start (orphaned node from prior runs)
 * - kills the full child process tree on Ctrl+C / terminal close
 */
/* global console, process */
import { spawn } from 'node:child_process';
import { createInterface } from 'node:readline';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import treeKill from 'tree-kill';

const WEB_PORT = 3000;
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const webDir = join(rootDir, 'apps', 'web');
const viteJs = join(rootDir, 'node_modules', 'vite', 'bin', 'vite.js');
const killPortScript = join(rootDir, 'scripts', 'kill-port.mjs');

/** @type {import('node:child_process').ChildProcess | null} */
let child = null;
let isShuttingDown = false;

function runKillPort() {
  return new Promise((resolve, reject) => {
    const killPort = spawn(process.execPath, [killPortScript, String(WEB_PORT)], {
      cwd: rootDir,
      stdio: 'inherit',
      env: process.env,
    });

    killPort.on('error', reject);
    killPort.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`kill-port exited with code ${code ?? 'unknown'}`));
    });
  });
}

function stopChildTree(pid) {
  return new Promise((resolve) => {
    if (process.platform === 'win32') {
      const killer = spawn('taskkill', ['/PID', String(pid), '/T', '/F'], {
        stdio: 'ignore',
        windowsHide: true,
      });
      killer.on('exit', () => resolve());
      killer.on('error', () => resolve());
      return;
    }

    treeKill(pid, 'SIGTERM', () => resolve());
  });
}

async function shutdown(signal) {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  console.log(`[dev-web] ${signal} — stopping dev server`);

  if (child?.pid) {
    await stopChildTree(child.pid);
  }

  try {
    await runKillPort();
  } catch (error) {
    console.warn('[dev-web] kill-port during shutdown:', error.message);
  }

  process.exit(0);
}

function startWebServe() {
  child = spawn(process.execPath, [viteJs, 'dev'], {
    cwd: webDir,
    stdio: 'inherit',
    env: process.env,
    windowsHide: true,
  });

  child.on('exit', (code, signal) => {
    if (isShuttingDown) {
      return;
    }

    if (signal) {
      process.exit(1);
      return;
    }

    process.exit(code ?? 0);
  });

  child.on('error', (error) => {
    console.error('[dev-web] failed to start vite:', error);
    process.exit(1);
  });
}

for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
  process.on(signal, () => {
    void shutdown(signal);
  });
}

if (process.platform === 'win32' && process.stdin.isTTY) {
  createInterface({ input: process.stdin, escapeCodeTimeout: 50 });
  process.stdin.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

try {
  await runKillPort();
  startWebServe();
} catch (error) {
  console.error('[dev-web]', error);
  process.exit(1);
}
