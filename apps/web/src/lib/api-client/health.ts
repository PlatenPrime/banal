import type { LivenessResponse, ReadinessResponse } from '@app/shared-contracts';
import { livenessResponseSchema, readinessResponseSchema } from '@app/shared-contracts';

export type { LivenessResponse, ReadinessResponse };

/** Runtime helpers stay sourced from shared-contracts — no local shape duplicates. */
export { livenessResponseSchema, readinessResponseSchema };
