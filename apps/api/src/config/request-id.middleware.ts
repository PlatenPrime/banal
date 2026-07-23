import { randomUUID } from 'node:crypto';
import { type INestApplication } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import { attachRequestIdToActiveSpan } from '../observability/request-id-span';

export const REQUEST_ID_HEADER = 'x-request-id';
export const MAX_REQUEST_ID_LENGTH = 128;

/** Safe inbound IDs: alphanumeric, underscore, hyphen; rejects injection attempts. */
export const REQUEST_ID_PATTERN = /^[A-Za-z0-9_-]{1,128}$/;

export type RequestWithId = Request & { requestId: string };

function readHeaderValue(value: string | string[] | undefined): string | undefined {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (Array.isArray(value)) {
    return readHeaderValue(value[0]);
  }

  return undefined;
}

/**
 * Accepts a valid client-provided id or generates a new UUID.
 */
export function resolveRequestId(header: string | string[] | undefined): string {
  const incoming = readHeaderValue(header);

  if (incoming !== undefined && REQUEST_ID_PATTERN.test(incoming)) {
    return incoming;
  }

  return randomUUID();
}

/**
 * Ensures every response carries `x-request-id` and attaches `requestId` to the request.
 * Also sets `request.id` on the active OTel span when one exists.
 * Apply early in bootstrap (before CORS/versioning) so all routes are covered.
 */
export function applyRequestIdMiddleware(app: INestApplication): void {
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = resolveRequestId(req.headers[REQUEST_ID_HEADER]);
    (req as RequestWithId).requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    attachRequestIdToActiveSpan(requestId);
    next();
  });
}
