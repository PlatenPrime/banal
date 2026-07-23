import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HomePage } from './components/home-page';
import { resetApiClientForTests } from './lib/api-client/create-api-client';
import { Route } from './routes/index';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <HomePage />
    </QueryClientProvider>,
  );
}

function stubAnonymousMe() {
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
}

describe('index route', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    resetApiClientForTests();
  });

  it('exports a file route module', () => {
    expect(Route).toBeDefined();
    expect(Route.options.component).toBeTypeOf('function');
  });

  it('renders home with navigation links', () => {
    stubAnonymousMe();
    renderHome();

    expect(screen.getByRole('heading', { name: 'banal' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Examples' }).getAttribute('href')).toBe('/examples');
    expect(screen.getByRole('link', { name: 'New example' }).getAttribute('href')).toBe(
      '/examples/new',
    );
  });

  it('applies Tailwind utility classes on the shell', () => {
    stubAnonymousMe();
    const { container } = renderHome();
    const main = container.querySelector('main');

    expect(main?.className).toContain('mx-auto');
    expect(main?.className).toContain('max-w-3xl');
  });
});
