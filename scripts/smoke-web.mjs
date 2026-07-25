#!/usr/bin/env node
/**
 * Staging/production web SSR smoke for Vercel (T22).
 *
 * Usage:
 *   WEB_BASE_URL=https://….vercel.app node scripts/smoke-web.mjs
 */
/* global console, process, fetch */

const base = (process.env.WEB_BASE_URL ?? '').replace(/\/$/, '');
if (!base) {
  console.error('WEB_BASE_URL is required (e.g. https://….vercel.app)');
  process.exit(1);
}

/** @type {Array<{ path: string, markers: string[] }>} */
const checks = [
  { path: '/', markers: ['banal', '<html'] },
  { path: '/login', markers: ['Sign in', '<html'] },
];

/**
 * @param {string} path
 * @param {string[]} markers
 */
async function check(path, markers) {
  const url = `${base}${path}`;
  const res = await fetch(url, {
    headers: { accept: 'text/html' },
    redirect: 'follow',
  });
  const body = await res.text();
  console.log(`GET ${path} → ${res.status}`);

  if (!res.ok) {
    throw new Error(`${path} failed with ${res.status}`);
  }

  const contentType = res.headers.get('content-type') ?? '';
  if (!contentType.includes('text/html')) {
    throw new Error(`${path} expected text/html, got ${contentType || '(missing)'}`);
  }

  for (const marker of markers) {
    if (!body.toLowerCase().includes(marker.toLowerCase())) {
      console.log(body.slice(0, 500));
      throw new Error(`${path} missing SSR marker: ${marker}`);
    }
  }
}

async function main() {
  for (const { path, markers } of checks) {
    await check(path, markers);
  }
  console.log('smoke-web: ok');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
