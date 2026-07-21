import { describe, expect, it } from 'vitest';
import type { IncomingMessage } from 'node:http';
import {
  createLoggerModuleParams,
  createPinoHttpOptions,
  resolveLogRequestId,
} from './logger.config';
import type { RequestWithId } from './request-id.middleware';

function mockReq(
  partial: Partial<RequestWithId> & { headers?: IncomingMessage['headers'] },
): IncomingMessage {
  return {
    headers: {},
    ...partial,
  } as IncomingMessage;
}

describe('resolveLogRequestId', () => {
  it('prefers req.requestId set by the request-id middleware', () => {
    const req = mockReq({ requestId: 'middleware-trace-1' });
    expect(resolveLogRequestId(req)).toBe('middleware-trace-1');
  });

  it('falls back to a valid x-request-id header', () => {
    const req = mockReq({
      headers: { 'x-request-id': 'header-trace-2' },
    });
    expect(resolveLogRequestId(req)).toBe('header-trace-2');
  });
});

describe('createPinoHttpOptions', () => {
  it('disables autoLogging so Track 9 can own request lines', () => {
    expect(createPinoHttpOptions().autoLogging).toBe(false);
  });

  it('puts the same requestId into genReqId and customProps', () => {
    const options = createPinoHttpOptions();
    const req = mockReq({ requestId: 'corr-abc_123' });

    const reqId = options.genReqId?.(req, {} as never);
    const props = options.customProps?.(req, {} as never);

    expect(reqId).toBe('corr-abc_123');
    expect(props).toEqual({ requestId: 'corr-abc_123' });
  });

  it('keeps genReqId and customProps aligned when only the header is present', () => {
    const options = createPinoHttpOptions();
    const req = mockReq({
      headers: { 'x-request-id': 'upstream-42' },
    });

    expect(options.genReqId?.(req, {} as never)).toBe('upstream-42');
    expect(options.customProps?.(req, {} as never)).toEqual({ requestId: 'upstream-42' });
  });
});

describe('createLoggerModuleParams', () => {
  it('wires pinoHttp options for LoggerModule', () => {
    const params = createLoggerModuleParams();
    expect(params.pinoHttp).toMatchObject({ autoLogging: false });
  });
});
