import type { IncomingMessage } from 'node:http';
import type { Params } from 'nestjs-pino';
import type { Options as PinoHttpOptions } from 'pino-http';
import type { Env } from './env.schema';
import { REQUEST_ID_HEADER, resolveRequestId, type RequestWithId } from './request-id.middleware';

export type NodeEnv = Env['NODE_ENV'];

/**
 * Resolves the correlation id for pino-http from the request-id middleware field,
 * falling back to the same header resolution rules as step 039.
 */
export function resolveLogRequestId(req: IncomingMessage): string {
  const request = req as RequestWithId;

  if (typeof request.requestId === 'string' && request.requestId.length > 0) {
    return request.requestId;
  }

  return resolveRequestId(request.headers[REQUEST_ID_HEADER]);
}

/**
 * Pino log level by NODE_ENV: verbose locally, quieter in test/prod.
 * No transport → newline-delimited JSON (ops-parseable).
 */
export function resolvePinoLevel(nodeEnv: NodeEnv): 'debug' | 'info' {
  return nodeEnv === 'development' ? 'debug' : 'info';
}

/**
 * Structured JSON pino-http options (correlation + level).
 * Redact (090) and per-request auto lines (091) stay out of this step.
 */
export function createPinoHttpOptions(nodeEnv: NodeEnv = 'production'): PinoHttpOptions {
  return {
    level: resolvePinoLevel(nodeEnv),
    autoLogging: false,
    genReqId: (req) => resolveLogRequestId(req),
    customProps: (req) => ({
      requestId: resolveLogRequestId(req),
    }),
  };
}

export function createLoggerModuleParams(nodeEnv: NodeEnv): Params {
  return {
    pinoHttp: createPinoHttpOptions(nodeEnv),
  };
}
