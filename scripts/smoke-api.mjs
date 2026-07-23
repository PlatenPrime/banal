#!/usr/bin/env node
/**
 * Staging/production API smoke for Railway (T21).
 *
 * Usage:
 *   API_BASE_URL=https://….up.railway.app node scripts/smoke-api.mjs
 *   API_BASE_URL=… SMOKE_USER=admin SMOKE_PASSWORD=… node scripts/smoke-api.mjs
 */
/* global console, process, fetch */

const base = (process.env.API_BASE_URL ?? '').replace(/\/$/, '');
if (!base) {
  console.error('API_BASE_URL is required (e.g. https://….up.railway.app)');
  process.exit(1);
}

async function check(path, init) {
  const url = `${base}${path}`;
  const res = await fetch(url, init);
  const body = await res.text();
  console.log(`${init?.method ?? 'GET'} ${path} → ${res.status}`);
  if (body) {
    console.log(body.slice(0, 500));
  }
  if (!res.ok) {
    throw new Error(`${path} failed with ${res.status}`);
  }
  return res;
}

async function main() {
  await check('/health');
  await check('/health/ready');

  const user = process.env.SMOKE_USER;
  const password = process.env.SMOKE_PASSWORD;
  if (user && password) {
    const res = await check('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ username: user, password }),
    });
    const setCookie = res.headers.getSetCookie?.() ?? [];
    if (setCookie.length === 0) {
      console.warn('login 200 but no Set-Cookie headers visible (fetch may hide them)');
    } else {
      console.log(`Set-Cookie count: ${setCookie.length}`);
    }
  } else {
    console.log('Skipping login smoke (set SMOKE_USER + SMOKE_PASSWORD to enable)');
  }

  console.log('smoke-api: ok');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
