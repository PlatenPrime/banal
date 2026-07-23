import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import { isAllowedWebOrigin, type OriginAllowlistEnv } from './config/origin-allowlist';

export type CorsEnv = OriginAllowlistEnv;

/**
 * CORS from WEB_ORIGIN plus optional Vercel preview allowlist (list and/or regex).
 * Origin is required after ConfigModule + Zod validation.
 * Missing Origin is allowed for non-browser clients; CSRF middleware enforces Origin on mutations.
 */
export function getCorsOptions(env: CorsEnv): CorsOptions {
  return {
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      callback(null, isAllowedWebOrigin(origin, env));
    },
  };
}
