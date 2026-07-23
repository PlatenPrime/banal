export type OriginAllowlistEnv = {
  WEB_ORIGIN: string;
  WEB_ORIGIN_PREVIEW_REGEX?: string;
  WEB_ORIGIN_PREVIEW_LIST?: string;
};

function parsePreviewList(raw: string | undefined): Set<string> {
  if (!raw?.trim()) {
    return new Set();
  }

  return new Set(
    raw
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function compilePreviewRegex(raw: string | undefined): RegExp | undefined {
  if (!raw?.trim()) {
    return undefined;
  }

  try {
    return new RegExp(raw);
  } catch {
    // Fail-safe: invalid patterns must not crash boot; ignore until fixed in env.
    console.warn(
      `[origin-allowlist] WEB_ORIGIN_PREVIEW_REGEX is invalid and will be ignored: ${JSON.stringify(raw)}`,
    );
    return undefined;
  }
}

/**
 * Returns whether `origin` is the primary WEB_ORIGIN or an allowed preview.
 * Does not treat a missing Origin as allowed — callers decide that policy.
 */
export function isAllowedWebOrigin(origin: string, env: OriginAllowlistEnv): boolean {
  if (origin === env.WEB_ORIGIN) {
    return true;
  }

  const previewList = parsePreviewList(env.WEB_ORIGIN_PREVIEW_LIST);
  if (previewList.has(origin)) {
    return true;
  }

  const previewRegex = compilePreviewRegex(env.WEB_ORIGIN_PREVIEW_REGEX);
  return previewRegex?.test(origin) === true;
}
