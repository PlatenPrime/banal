import { type INestApplication, VersioningType } from '@nestjs/common';

export const API_GLOBAL_PREFIX = 'api';
export const API_DEFAULT_VERSION = '1';

/**
 * URI versioning under `/api/v1/...`. Health excludes land in 036/044.
 */
export function applyApiUriVersioning(app: INestApplication): void {
  app.setGlobalPrefix(API_GLOBAL_PREFIX);
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: API_DEFAULT_VERSION,
  });
}
