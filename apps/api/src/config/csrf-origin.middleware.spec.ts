import { ERROR_TYPE_URIS, problemDetailsSchema } from '@app/shared-contracts';
import { describe, expect, it, vi } from 'vitest';
import {
  CSRF_MUTATING_METHODS,
  createCsrfOriginMiddleware,
  isCsrfMutatingMethod,
} from './csrf-origin.middleware';

describe('CSRF Origin middleware', () => {
  it('covers POST PUT PATCH DELETE mutating methods (double-submit cookie deferred)', () => {
    expect(CSRF_MUTATING_METHODS).toEqual(['POST', 'PUT', 'PATCH', 'DELETE']);
    expect(isCsrfMutatingMethod('post')).toBe(true);
    expect(isCsrfMutatingMethod('GET')).toBe(false);
  });

  it('allows mutating requests with an allowlisted Origin', () => {
    const middleware = createCsrfOriginMiddleware({ WEB_ORIGIN: 'http://localhost:3000' });
    const next = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    middleware(
      {
        method: 'POST',
        headers: { origin: 'http://localhost:3000' },
        url: '/api/v1/auth/login',
      } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('rejects mutating requests with a bad Origin using Problem Details 403', () => {
    const middleware = createCsrfOriginMiddleware({ WEB_ORIGIN: 'http://localhost:3000' });
    const next = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    middleware(
      {
        method: 'POST',
        headers: { origin: 'https://evil.example.com' },
        originalUrl: '/api/v1/auth/login',
        url: '/api/v1/auth/login',
      } as never,
      res as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.type).toHaveBeenCalledWith('application/problem+json');

    const body = res.json.mock.calls[0]?.[0];
    expect(problemDetailsSchema.parse(body)).toMatchObject({
      type: ERROR_TYPE_URIS.forbidden,
      status: 403,
      detail: 'Origin not allowed',
      instance: '/api/v1/auth/login',
    });
  });

  it('rejects mutating requests with a missing Origin', () => {
    const middleware = createCsrfOriginMiddleware({ WEB_ORIGIN: 'http://localhost:3000' });
    const next = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    middleware(
      { method: 'DELETE', headers: {}, url: '/api/v1/examples/1' } as never,
      res as never,
      next,
    );

    expect(next).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
  });

  it('skips Origin checks for safe methods', () => {
    const middleware = createCsrfOriginMiddleware({ WEB_ORIGIN: 'http://localhost:3000' });
    const next = vi.fn();
    const res = {
      status: vi.fn().mockReturnThis(),
      type: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };

    middleware(
      { method: 'GET', headers: {}, url: '/api/v1/examples' } as never,
      res as never,
      next,
    );

    expect(next).toHaveBeenCalledOnce();
    expect(res.status).not.toHaveBeenCalled();
  });
});
