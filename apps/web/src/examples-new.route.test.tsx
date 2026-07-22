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
      vi.fn().mockResolvedValue(
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
      ),
    );

    renderNewExamplePage();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'Created' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
    });

    const [request] = vi.mocked(fetch).mock.calls[0] ?? [];
    expect(request).toBeInstanceOf(Request);
    expect((request as Request).url).toBe('http://localhost:4000/api/v1/examples');
    expect((request as Request).method).toBe('POST');
    await expect((request as Request).clone().text()).resolves.toBe(
      JSON.stringify({ name: 'Created' }),
    );

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith({ to: '/examples' });
    });
  });

  it('shows API validation errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
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
      ),
    );

    renderNewExamplePage();

    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'x' } });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByText('name must be longer than or equal to 1 characters')).toBeDefined();
    });
  });
});
