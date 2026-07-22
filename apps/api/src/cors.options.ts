import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export type CorsEnv = {
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
      `[cors] WEB_ORIGIN_PREVIEW_REGEX is invalid and will be ignored: ${JSON.stringify(raw)}`,
    );
    return undefined;
  }
}

/**
 * CORS from WEB_ORIGIN plus optional Vercel preview allowlist (list and/or regex).
 * Origin is required after ConfigModule + Zod validation.
 */
export function getCorsOptions(env: CorsEnv): CorsOptions {
  const primary = env.WEB_ORIGIN;
  const previewList = parsePreviewList(env.WEB_ORIGIN_PREVIEW_LIST);
  const previewRegex = compilePreviewRegex(env.WEB_ORIGIN_PREVIEW_REGEX);

  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (origin === primary || previewList.has(origin) || previewRegex?.test(origin)) {
        callback(null, true);
        return;
      }

      callback(null, false);
    },
  };
}
