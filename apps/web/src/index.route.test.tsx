import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { HomePage } from './components/home-page';
import { Route } from './routes/index';

vi.mock('@tanstack/react-router', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tanstack/react-router')>();
  return {
    ...actual,
    Link: ({ to, children }: { to: string; children: ReactNode }) => <a href={to}>{children}</a>,
  };
});

describe('index route', () => {
  it('exports a file route module', () => {
    expect(Route).toBeDefined();
    expect(Route.options.component).toBeTypeOf('function');
  });

  it('renders home with navigation links', () => {
    render(<HomePage />);

    expect(screen.getByRole('heading', { name: 'banal' })).toBeDefined();
    expect(screen.getByRole('link', { name: 'Examples' }).getAttribute('href')).toBe('/examples');
    expect(screen.getByRole('link', { name: 'New example' }).getAttribute('href')).toBe(
      '/examples/new',
    );
  });

  it('applies Tailwind utility classes on the shell', () => {
    const { container } = render(<HomePage />);
    const main = container.querySelector('main');

    expect(main?.className).toContain('mx-auto');
    expect(main?.className).toContain('max-w-3xl');
  });
});
