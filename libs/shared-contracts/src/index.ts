/** Placeholder marker — real Zod contracts land in Track 2 (025–030). */
export type SharedContractsReady = true;

export const SHARED_CONTRACTS_READY = true as const satisfies SharedContractsReady;

export { problemDetailsSchema, type ProblemDetails } from './problem-details';

export {
  healthStatusSchema,
  healthCheckResultSchema,
  livenessResponseSchema,
  readinessResponseSchema,
  type HealthStatus,
  type HealthCheckResult,
  type LivenessResponse,
  type ReadinessResponse,
} from './health';

export {
  createExampleRequestSchema,
  exampleDtoSchema,
  exampleListResponseSchema,
  type CreateExampleRequest,
  type ExampleDto,
  type ExampleListResponse,
} from './examples';

export {
  loginRequestSchema,
  registerRequestSchema,
  authUserSchema,
  type LoginRequest,
  type RegisterRequest,
  type AuthUser,
} from './auth';

export { ERROR_TYPE_URIS, errorTypeUriSchema, type ErrorTypeUri } from './error-codes';
