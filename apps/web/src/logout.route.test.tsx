import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { LogoutPage } from './components/logout-page';
import { resetApiClientForTests } from './lib/api-client/create-api-client';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

function requestUrl(input: RequestInfo | URL): string {
  if (typeof input === 'string') {
    return input;
  }
  if (input instanceof URL) {
    return input.toString();
  }
  if (input instanceof Request) {
    return input.url;
  }
  return '';
}

describe('logout page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    resetApiClientForTests();
    navigateMock.mockReset();
  });

  it('calls logout and redirects home', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo | URL) => {
        const url = requestUrl(input);
        if (url.includes('/auth/me')) {
          return Promise.resolve(
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
          );
        }

        return Promise.resolve(new Response(null, { status: 204 }));
      }),
    );

    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <LogoutPage />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/' });
    });

    const logoutCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => requestUrl(input as RequestInfo).includes('/auth/logout'));
    expect(logoutCall?.[0]).toBeInstanceOf(Request);
    expect((logoutCall?.[0] as Request).url).toBe('http://localhost:4000/api/v1/auth/logout');
  });
});
