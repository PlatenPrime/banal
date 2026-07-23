const ALLOW_LEGACY_WRITE_PREFIX = 'ALLOW_LEGACY_WRITE_';

/**
 * Parse `ALLOW_LEGACY_WRITE_<COLLECTION>` env keys into a map of collection → allowed.
 * Missing / invalid / falsey values mean writes are forbidden (ADR-001 default).
 */
export function parseAllowLegacyWriteFlags(
  env: NodeJS.ProcessEnv | Record<string, string | undefined>,
): ReadonlyMap<string, boolean> {
  const result = new Map<string, boolean>();

  for (const [key, raw] of Object.entries(env)) {
    if (!key.startsWith(ALLOW_LEGACY_WRITE_PREFIX)) {
      continue;
    }

    const collection = key.slice(ALLOW_LEGACY_WRITE_PREFIX.length).toLowerCase();
    if (!collection) {
      continue;
    }

    result.set(collection, parseEnvBoolean(raw));
  }

  return result;
}

function parseEnvBoolean(raw: string | undefined): boolean {
  if (raw === undefined) {
    return false;
  }

  const normalized = raw.trim();
  return (
    normalized === 'true' || normalized === '1' || normalized === 'TRUE' || normalized === 'True'
  );
}
