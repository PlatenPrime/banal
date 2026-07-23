import { describe, expect, it, vi } from 'vitest';
import { isAllowedWebOrigin } from './origin-allowlist';

describe('isAllowedWebOrigin', () => {
  it('allows the primary WEB_ORIGIN', () => {
    expect(
      isAllowedWebOrigin('http://localhost:3000', { WEB_ORIGIN: 'http://localhost:3000' }),
    ).toBe(true);
    expect(
      isAllowedWebOrigin('https://evil.example.com', { WEB_ORIGIN: 'http://localhost:3000' }),
    ).toBe(false);
  });

  it('allows origins from WEB_ORIGIN_PREVIEW_LIST', () => {
    const env = {
      WEB_ORIGIN: 'https://staging.example.com',
      WEB_ORIGIN_PREVIEW_LIST: 'https://foo.vercel.app, https://bar.vercel.app',
    };

    expect(isAllowedWebOrigin('https://foo.vercel.app', env)).toBe(true);
    expect(isAllowedWebOrigin('https://other.vercel.app', env)).toBe(false);
  });

  it('allows origins matching WEB_ORIGIN_PREVIEW_REGEX', () => {
    const env = {
      WEB_ORIGIN: 'https://staging.example.com',
      WEB_ORIGIN_PREVIEW_REGEX: String.raw`^https://.*\.vercel\.app$`,
    };

    expect(isAllowedWebOrigin('https://pr-42-team.vercel.app', env)).toBe(true);
    expect(isAllowedWebOrigin('https://evil.example.com', env)).toBe(false);
  });

  it('ignores invalid WEB_ORIGIN_PREVIEW_REGEX without crashing', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const env = {
      WEB_ORIGIN: 'https://staging.example.com',
      WEB_ORIGIN_PREVIEW_REGEX: '[invalid',
    };

    expect(isAllowedWebOrigin('https://pr.vercel.app', env)).toBe(false);
    expect(isAllowedWebOrigin('https://staging.example.com', env)).toBe(true);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });
});
