import { z } from 'zod';

export const healthStatusSchema = z.enum(['ok', 'error']);

export const healthCheckResultSchema = z.object({
  status: healthStatusSchema,
  detail: z.string().optional(),
});

export const livenessResponseSchema = z.object({
  status: z.literal('ok'),
});

export const readinessResponseSchema = z.object({
  status: healthStatusSchema,
  info: z.record(healthCheckResultSchema).optional(),
  error: z.record(healthCheckResultSchema).optional(),
  details: z.record(healthCheckResultSchema).optional(),
});

export type HealthStatus = z.infer<typeof healthStatusSchema>;
export type HealthCheckResult = z.infer<typeof healthCheckResultSchema>;
export type LivenessResponse = z.infer<typeof livenessResponseSchema>;
export type ReadinessResponse = z.infer<typeof readinessResponseSchema>;
