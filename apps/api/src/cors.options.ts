import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

export type CorsEnv = {
  WEB_ORIGIN: string;
};

/**
 * Dev CORS from WEB_ORIGIN. Origin is required after ConfigModule + Zod validation.
 */
export function getCorsOptions(env: CorsEnv): CorsOptions {
  return {
    origin: env.WEB_ORIGIN,
  };
}
