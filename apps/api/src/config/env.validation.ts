import { envSchema, type Env } from './env.schema';

/**
 * Nest ConfigModule `validate` callback — fail-fast on invalid env.
 */
export function validate(config: Record<string, unknown>): Env {
  return envSchema.parse(config);
}
