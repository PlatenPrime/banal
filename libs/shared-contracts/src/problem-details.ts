import { z } from 'zod';

/**
 * RFC 9457 Problem Details for HTTP APIs.
 * @see https://www.rfc-editor.org/rfc/rfc9457
 */
export const problemDetailsSchema = z.object({
  type: z.url(),
  title: z.string().min(1),
  status: z.number().int().min(100).max(599),
  detail: z.string().optional(),
  instance: z.string().optional(),
  errors: z.record(z.string(), z.array(z.string())).optional(),
});

export type ProblemDetails = z.infer<typeof problemDetailsSchema>;
