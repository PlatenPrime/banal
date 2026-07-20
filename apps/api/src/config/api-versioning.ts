import { type INestApplication, RequestMethod, VersioningType } from '@nestjs/common';

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';

/** Routes excluded from `/api` — health probes stay at `/health`, `/health/ready`. */
export const API_PREFIX_EXCLUDE_PATHS = ['health', 'health/(.*)'] as const;

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
