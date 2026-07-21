import { z } from 'zod';

export const webEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
});

export type WebEnv = z.infer<typeof webEnvSchema>;

export function parseWebEnv(source: Record<string, unknown>): WebEnv {
  return webEnvSchema.parse(source);
}

export const env = parseWebEnv(import.meta.env);
