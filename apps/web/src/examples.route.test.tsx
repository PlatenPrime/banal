import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { ExamplesError, ExamplesPage } from './components/examples-page';
import { ApiClientError } from './lib/api-client/client';

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

describe('examples page', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders fetched examples', () => {
    vi.mocked(useSuspenseQuery).mockReturnValue({
      data: {
        items: [{ id: '1', name: 'Alpha', createdAt: '2026-07-21T10:00:00.000Z' }],
        total: 1,
      },
    } as never);

    render(<ExamplesPage />);

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
