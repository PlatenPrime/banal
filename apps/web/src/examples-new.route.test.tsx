import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { NewExamplePage } from './components/new-example-page';

const navigateMock = vi.fn();

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

function renderNewExamplePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <NewExamplePage />
    </QueryClientProvider>,
  );
}

describe('new example page', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    navigateMock.mockReset();
  });

  it('submits a create request and navigates on success', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo) => {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
        if (url.includes('/auth/me')) {
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
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              id: '1',
              name: 'Created',
              createdAt: '2026-07-21T10:00:00.000Z',
            }),
            {
              status: 201,
              headers: { 'content-type': 'application/json' },
            },
          ),
        );
      }),
    );

    renderNewExamplePage();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Created' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/examples' });
    });

    const createCall = vi.mocked(fetch).mock.calls.find(([input]) => {
      const req = input as Request;
      return req instanceof Request && req.method === 'POST' && req.url.includes('/examples');
    });
    expect(createCall?.[0]).toBeInstanceOf(Request);
    const request = createCall?.[0] as Request;
    expect(request.url).toBe('http://localhost:4000/api/v1/examples');
    await expect(request.clone().text()).resolves.toBe(JSON.stringify({ name: 'Created' }));
  });

  it('shows API validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: RequestInfo) => {
        const url = typeof input === 'string' ? input : input instanceof Request ? input.url : '';
        if (url.includes('/auth/me')) {
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
        }

        return Promise.resolve(
          new Response(
            JSON.stringify({
              type: ERROR_TYPE_URIS.validationFailed,
              title: 'Validation failed',
              status: 422,
              errors: {
                name: ['name must be longer than or equal to 1 characters'],
              },
            }),
            {
              status: 422,
              headers: { 'content-type': 'application/problem+json' },
            },
          ),
        );
      }),
    );

    renderNewExamplePage();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('name must be longer than or equal to 1 characters')).toBeDefined();
    });
  });
});
