import { describe, expect, it, vi } from 'vitest';
import { getCorsOptions } from './cors.options';

function resolveOrigin(
  options: ReturnType<typeof getCorsOptions>,
  origin: string | undefined,
): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const originFn = options.origin;
    if (typeof originFn !== 'function') {
      reject(new Error('expected origin callback'));
      return;
    }

    originFn(origin ?? '', (err, allow) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(Boolean(allow));
    });
  });
}

describe('getCorsOptions', () => {
  it('allows the primary WEB_ORIGIN', async () => {
    const options = getCorsOptions({
      WEB_ORIGIN: 'http://localhost:3000',
    });

    await expect(resolveOrigin(options, 'http://localhost:3000')).resolves.toBe(true);
    await expect(resolveOrigin(options, 'https://evil.example.com')).resolves.toBe(false);
  });

  it('allows origins from WEB_ORIGIN_PREVIEW_LIST', async () => {
    const options = getCorsOptions({
      WEB_ORIGIN: 'https://staging.example.com',
      WEB_ORIGIN_PREVIEW_LIST: 'https://foo.vercel.app, https://bar.vercel.app',
    });

    await expect(resolveOrigin(options, 'https://foo.vercel.app')).resolves.toBe(true);
    await expect(resolveOrigin(options, 'https://bar.vercel.app')).resolves.toBe(true);
    await expect(resolveOrigin(options, 'https://other.vercel.app')).resolves.toBe(false);
  });

  it('allows origins matching WEB_ORIGIN_PREVIEW_REGEX', async () => {
    const options = getCorsOptions({
      WEB_ORIGIN: 'https://staging.example.com',
      WEB_ORIGIN_PREVIEW_REGEX: String.raw`^https://.*\.vercel\.app$`,
    });

    await expect(resolveOrigin(options, 'https://pr-42-team.vercel.app')).resolves.toBe(true);
    await expect(resolveOrigin(options, 'https://evil.example.com')).resolves.toBe(false);
  });

  it('ignores invalid WEB_ORIGIN_PREVIEW_REGEX without crashing', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const options = getCorsOptions({
      WEB_ORIGIN: 'https://staging.example.com',
      WEB_ORIGIN_PREVIEW_REGEX: '[invalid',
    });

    await expect(resolveOrigin(options, 'https://pr.vercel.app')).resolves.toBe(false);
    await expect(resolveOrigin(options, 'https://staging.example.com')).resolves.toBe(true);
    expect(warn).toHaveBeenCalled();

    warn.mockRestore();
  });

  it('allows requests with no Origin header', async () => {
    const options = getCorsOptions({
      WEB_ORIGIN: 'http://localhost:3000',
    });

    await expect(resolveOrigin(options, undefined)).resolves.toBe(true);
  });
});
