/** Helpers for cookie-jar style e2e against httpOnly Set-Cookie responses. */

export function parseSetCookieHeaders(headers: Headers): Map<string, string> {
  const jar = new Map<string, string>();
  const raw = headers.getSetCookie?.() ?? [];

  for (const entry of raw) {
    const [pair] = entry.split(';');
    const eq = pair.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const name = pair.slice(0, eq).trim();
    const value = pair.slice(eq + 1).trim();
    jar.set(name, value);
  }

  return jar;
}

export function mergeCookies(jar: Map<string, string>, headers: Headers): Map<string, string> {
  const next = new Map(jar);
  for (const [name, value] of parseSetCookieHeaders(headers)) {
    next.set(name, value);
  }
  return next;
}

export function cookieHeader(jar: Map<string, string>, names?: string[]): string {
  const entries = names
    ? names.filter((name) => jar.has(name)).map((name) => `${name}=${jar.get(name)}`)
    : [...jar.entries()].map(([name, value]) => `${name}=${value}`);
  return entries.join('; ');
}
