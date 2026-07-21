/**
 * Frees a TCP port before starting a dev server.
 * Reads PORT from argv[2], apps/api/.env, or defaults to 4000.
 */
/* global console, process */
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const DEFAULT_PORT = 4000;

function resolvePort() {
  const fromArg = process.argv[2];
  if (fromArg) {
    const port = Number(fromArg);
    if (!Number.isInteger(port) || port <= 0) {
      throw new Error(`Invalid port: ${fromArg}`);
    }
    return port;
  }

  const envPath = join(process.cwd(), 'apps', 'api', '.env');
  if (existsSync(envPath)) {
    const match = readFileSync(envPath, 'utf8').match(/^PORT=(\d+)\s*$/m);
    if (match) {
      return Number(match[1]);
    }
  }

  return DEFAULT_PORT;
}

function getListeningPids(port) {
  if (process.platform === 'win32') {
    try {
      const output = execSync('netstat -ano', { encoding: 'utf8' });
      const portSuffix = `:${port}`;
      const pids = new Set();

      for (const line of output.split(/\r?\n/)) {
        if (!line.includes('LISTENING')) {
          continue;
        }

        const columns = line.trim().split(/\s+/);
        const localAddress = columns[1] ?? '';
        if (!localAddress.endsWith(portSuffix)) {
          continue;
        }

        const pid = Number(columns.at(-1));
        if (pid > 0) {
          pids.add(pid);
        }
      }

      return [...pids];
    } catch {
      return [];
    }
  }

  try {
    return execSync(`lsof -nP -iTCP:${port} -sTCP:LISTEN -t`, { encoding: 'utf8' })
      .trim()
      .split(/\r?\n/)
      .filter(Boolean)
      .map(Number);
  } catch {
    return [];
  }
}

function killPid(pid) {
  if (process.platform === 'win32') {
    execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
    return;
  }

  process.kill(pid, 'SIGTERM');
}

const port = resolvePort();
const pids = getListeningPids(port);

if (pids.length === 0) {
  console.log(`[kill-port] port ${port} is free`);
  process.exit(0);
}

for (const pid of pids) {
  console.log(`[kill-port] stopping PID ${pid} on port ${port}`);
  killPid(pid);
}
