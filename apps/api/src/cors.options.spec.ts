import { describe, expect, it } from 'vitest';
import { getCorsOptions } from './cors.options';

describe('getCorsOptions', () => {
  it('reads WEB_ORIGIN from env', () => {
    const options = getCorsOptions({
      WEB_ORIGIN: 'http://localhost:3000',
    });

    expect(options.origin).toBe('http://localhost:3000');
  });

  it('leaves origin undefined when WEB_ORIGIN is missing', () => {
    const options = getCorsOptions({});

    expect(options.origin).toBeUndefined();
  });
});
