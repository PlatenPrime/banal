import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { ExamplesError, ExamplesPage } from './components/examples-page';
import { ApiClientError } from './lib/api-client/client';
import { resetApiClientForTests } from './lib/api-client/create-api-client';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

vi.mock('@tanstack/react-query', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-query')>();
  return {
    ...actual,
    useSuspenseQuery: vi.fn(),
  };
});

import { useSuspenseQuery } from '@tanstack/react-query';

function renderExamples() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ExamplesPage />
    </QueryClientProvider>,
  );
}

describe('examples page', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
    resetApiClientForTests();
  });

  it('renders fetched examples', () => {
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

    vi.mocked(useSuspenseQuery).mockReturnValue({
      data: {
        items: [{ id: '1', name: 'Alpha', createdAt: '2026-07-21T10:00:00.000Z' }],
        total: 1,
      },
    } as never);

    renderExamples();

    expect(screen.getByText('Alpha')).toBeDefined();
    expect(screen.getByText('1 total')).toBeDefined();
  });

  it('renders API errors via error component', () => {
    render(
      <ExamplesError
        error={
          new ApiClientError('Server error', 500, {
            type: ERROR_TYPE_URIS.internal,
            title: 'Server error',
            status: 500,
          })
        }
        reset={() => undefined}
      />,
    );

    expect(screen.getByText('Server error')).toBeDefined();
  });
});
