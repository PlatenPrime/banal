import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import { type INestApplication, HttpStatus } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { isAllowedWebOrigin, type OriginAllowlistEnv } from './origin-allowlist';

/** HTTP methods that must present an allowlisted Origin (CSRF defense). */
export const CSRF_MUTATING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'] as const;

export type CsrfMutatingMethod = (typeof CSRF_MUTATING_METHODS)[number];

export function isCsrfMutatingMethod(method: string): method is CsrfMutatingMethod {
  return (CSRF_MUTATING_METHODS as readonly string[]).includes(method.toUpperCase());
}

/**
 * Rejects mutating requests whose Origin is missing or not on the WEB_ORIGIN allowlist.
 * Double-submit CSRF cookie is intentionally deferred (ADR-002 / T16 step 150).
 */
export function createCsrfOriginMiddleware(env: OriginAllowlistEnv) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!isCsrfMutatingMethod(req.method)) {
      next();
      return;
    }

    const origin = req.headers.origin;
    if (typeof origin === 'string' && isAllowedWebOrigin(origin, env)) {
      next();
      return;
    }

    const problem = problemDetailsSchema.parse({
      type: ERROR_TYPE_URIS.forbidden,
      title: 'Forbidden',
      status: HttpStatus.FORBIDDEN,
      detail: 'Origin not allowed',
      instance: req.originalUrl || req.url,
    });

    res.status(HttpStatus.FORBIDDEN).type('application/problem+json').json(problem);
  };
}

export function applyCsrfOriginMiddleware(app: INestApplication, env: OriginAllowlistEnv): void {
  app.use(createCsrfOriginMiddleware(env));
}
