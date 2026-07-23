import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppNav } from './components/app-nav';
import { resetApiClientForTests } from './lib/api-client/create-api-client';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

function renderNav() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <AppNav />
    </QueryClientProvider>,
  );
}

describe('AppNav', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    resetApiClientForTests();
  });

  it('shows Log in when anonymous', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            type: 'https://banal.app/problems/unauthorized',
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

    renderNav();

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Log in' }).getAttribute('href')).toBe('/login');
    });
  });

  it('shows username and Log out when authenticated', async () => {
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

    renderNav();

    await waitFor(() => {
      expect(screen.getByTestId('nav-username').textContent).toBe('admin');
      expect(screen.getByRole('link', { name: 'Log out' }).getAttribute('href')).toBe('/logout');
    });
  });
});
