import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { LoginPage } from './components/login-page';
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

function renderLoginPage(redirectTo?: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <LoginPage redirectTo={redirectTo} />
    </QueryClientProvider>,
  );
}

describe('login page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    resetApiClientForTests();
    navigateMock.mockReset();
  });

  it('submits login and redirects on success', async () => {
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

        return Promise.resolve(
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
        );
      }),
    );

    renderLoginPage('/examples/new');

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ href: '/examples/new' });
    });

    const loginCall = vi
      .mocked(fetch)
      .mock.calls.find(([input]) => requestUrl(input as RequestInfo).includes('/auth/login'));
    expect(loginCall?.[0]).toBeInstanceOf(Request);
    expect((loginCall?.[0] as Request).credentials).toBe('include');
  });

  it('shows Problem Details on invalid credentials', async () => {
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

        return Promise.resolve(
          new Response(
            JSON.stringify({
              type: ERROR_TYPE_URIS.unauthorized,
              title: 'Unauthorized',
              status: 401,
              detail: 'Invalid credentials',
            }),
            {
              status: 401,
              headers: { 'content-type': 'application/problem+json' },
            },
          ),
        );
      }),
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(screen.getByRole('alert').textContent).toContain('Invalid credentials');
    });
  });

  it('shows rate-limit message on 429', async () => {
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

        return Promise.resolve(
          new Response(
            JSON.stringify({
              type: ERROR_TYPE_URIS.rateLimited,
              title: 'Too Many Requests',
              status: 429,
              detail: 'Rate limit exceeded. Try again later.',
            }),
            {
              status: 429,
              headers: { 'content-type': 'application/problem+json' },
            },
          ),
        );
      }),
    );

    renderLoginPage();

    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      const alert = screen.getByRole('alert');
      expect(alert.textContent).toContain('Rate limit exceeded');
      expect(alert.getAttribute('data-rate-limited')).toBe('true');
    });
  });
});
