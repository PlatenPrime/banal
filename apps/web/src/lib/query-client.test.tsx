import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { createQueryClient } from './query-client';

describe('createQueryClient', () => {
  it('creates isolated query clients per call', () => {
    const first = createQueryClient();
    const second = createQueryClient();

    expect(first).not.toBe(second);
    expect(first.getDefaultOptions().queries?.staleTime).toBe(30_000);
  });

  it('mounts QueryClientProvider with a fresh client', () => {
    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <span>query-ready</span>
      </QueryClientProvider>,
    );

    expect(screen.getByText('query-ready')).toBeDefined();
  });
});
