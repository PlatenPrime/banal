import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Dev CORS from WEB_ORIGIN. Undefined origin leaves Nest default (reflective) disabled —
 * callers must set WEB_ORIGIN for browser clients.
 */
export function getCorsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
  return {
    origin: env.WEB_ORIGIN,
  };
}
