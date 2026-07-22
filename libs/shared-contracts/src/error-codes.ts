import { z } from 'zod';

export const ERROR_TYPE_URIS = {
  validationFailed: 'https://banal.app/problems/validation-failed',
  notFound: 'https://banal.app/problems/not-found',
  unauthorized: 'https://banal.app/problems/unauthorized',
  forbidden: 'https://banal.app/problems/forbidden',
  conflict: 'https://banal.app/problems/conflict',
  rateLimited: 'https://banal.app/problems/rate-limited',
  internal: 'https://banal.app/problems/internal',
} as const;

export type ErrorTypeUri = (typeof ERROR_TYPE_URIS)[keyof typeof ERROR_TYPE_URIS];

export const errorTypeUriSchema = z.enum([
  ERROR_TYPE_URIS.validationFailed,
  ERROR_TYPE_URIS.notFound,
  ERROR_TYPE_URIS.unauthorized,
  ERROR_TYPE_URIS.forbidden,
  ERROR_TYPE_URIS.conflict,
  ERROR_TYPE_URIS.rateLimited,
  ERROR_TYPE_URIS.internal,
]);
