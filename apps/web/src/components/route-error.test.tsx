import { cleanup, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ERROR_TYPE_URIS } from '@app/shared-contracts';
import { ApiClientError } from '../lib/api-client/client';
import { RouteError, RouteNotFound } from './route-error';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

afterEach(() => {
  cleanup();
});

describe('RouteError', () => {
  it('renders Problem Details from ApiClientError', () => {
    render(
      <RouteError
        error={
          new ApiClientError('Server error', 500, {
            type: ERROR_TYPE_URIS.internal,
            title: 'Server error',
            status: 500,
            detail: 'Unexpected failure',
            errors: { name: ['Required'] },
          })
        }
        reset={() => undefined}
      />,
    );

    expect(screen.getByText('Status 500')).toBeDefined();
    expect(screen.getByText('Server error')).toBeDefined();
    expect(screen.getByText('Unexpected failure')).toBeDefined();
    expect(screen.getByText('name: Required')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
  });

  it('renders a safe fallback for unknown errors', () => {
    render(<RouteError error={new Error('boom')} reset={() => undefined} />);

    expect(screen.getByText('Something went wrong')).toBeDefined();
    expect(screen.queryByText('boom')).toBeNull();
  });
});

describe('RouteNotFound', () => {
  it('renders not-found UX with a home link', () => {
    render(<RouteNotFound />);

    expect(screen.getByRole('heading', { name: 'Not found' })).toBeDefined();
    expect(screen.getByText('This page does not exist.')).toBeDefined();
    expect(screen.getByRole('link', { name: 'Home' }).getAttribute('href')).toBe('/');
  });
});
