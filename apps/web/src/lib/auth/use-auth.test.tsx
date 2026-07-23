import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { resetApiClientForTests } from '../api-client/create-api-client';
import { useAuth } from './use-auth';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useAuth', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetApiClientForTests();
  });

  it('loads the current user from /auth/me when document is available', async () => {
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

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({
      id: '1',
      email: 'admin@example.com',
      username: 'admin',
    });
  });
});
