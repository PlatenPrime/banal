import { redirect } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { requireAuth } from './require-auth';
import { resetApiClientForTests } from '../api-client/create-api-client';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    redirect: vi.fn((opts: unknown) => {
      const error = new Error('REDIRECT') as Error & { options: unknown };
      error.options = opts;
      return error;
    }),
  };
});

describe('requireAuth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetApiClientForTests();
    vi.mocked(redirect).mockClear();
  });

  it('skips auth checks during SSR', async () => {
    const hadDocument = 'document' in globalThis;
    const previousDocument = globalThis.document;
    // Simulate SSR: requireAuth checks typeof document !== 'undefined'
    Reflect.deleteProperty(globalThis, 'document');

    try {
      const queryClient = new QueryClient();
      await expect(
        requireAuth({
          context: { queryClient },
          location: { href: 'http://localhost:3000/examples/new', pathname: '/examples/new' },
        }),
      ).resolves.toBeUndefined();
    } finally {
      if (hadDocument) {
        Object.defineProperty(globalThis, 'document', {
          value: previousDocument,
          configurable: true,
          writable: true,
        });
      }
    }
  });

  it('allows access when /auth/me succeeds', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: '1',
            email: 'admin@example.com',
            username: 'admin',
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          },
        ),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await expect(
      requireAuth({
        context: { queryClient },
        location: { href: 'http://localhost:3000/examples/new', pathname: '/examples/new' },
      }),
    ).resolves.toBeUndefined();
  });

  it('redirects to login when /auth/me fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: ERROR_TYPE_URIS.unauthorized,
            title: 'Unauthorized',
            status: 401,
          }),
          {
            status: 401,
            headers: { 'content-type': 'application/problem+json' },
          },
        ),
      ),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });

    await expect(
      requireAuth({
        context: { queryClient },
        location: { href: 'http://localhost:3000/examples/new', pathname: '/examples/new' },
      }),
    ).rejects.toMatchObject({
      message: 'REDIRECT',
      options: {
        to: '/login',
        search: { redirect: '/examples/new' },
      },
    });
  });
});
