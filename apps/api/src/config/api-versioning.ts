import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';

/** Nest URI version segment (`v` + version) → `/api/v1`. */
export const API_URI_VERSION = `v${API_DEFAULT_VERSION}` as const;

/** Routes excluded from `/api` — health probes stay at `/health`, `/health/ready`. */
export const API_PREFIX_EXCLUDE_PATHS = ['health', 'health/{*path}'] as const;

function joinPath(...segments: string[]): string {
  const parts = segments
    .flatMap((segment) => segment.split('/'))
    .map((part) => part.trim())
    .filter(Boolean);
  return `/${parts.join('/')}`;
}

/** Versioned API path: `/api/v1` or `/api/v1/examples`. */
export function apiV1Path(...segments: string[]): string {
  return joinPath(API_GLOBAL_PREFIX, API_URI_VERSION, ...segments);
}

/** Global-prefix path without URI version: `/api/docs`, `/api/docs-json`, `/api/health`. */
export function apiPrefixedPath(...segments: string[]): string {
  return joinPath(API_GLOBAL_PREFIX, ...segments);
}

/**
 * URI versioning under `/api/v1/...`. Health routes are excluded from the global prefix.
 */
export function applyApiUriVersioning(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX, {
    exclude: API_PREFIX_EXCLUDE_PATHS.map((path) => ({
      path,
      method: RequestMethod.ALL,
    })),
  });
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
}
