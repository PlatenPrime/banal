import { describe, expect, it, vi } from 'vitest';
import { applyTrustProxy } from './trust-proxy';

describe('applyTrustProxy', () => {
  it('sets Express trust proxy to 1 when TRUST_PROXY is enabled', () => {
    const app = { set: vi.fn() };

    applyTrustProxy(app as never, true);

    expect(app.set).toHaveBeenCalledWith('trust proxy', 1);
  });

  it('does not change trust proxy when TRUST_PROXY is disabled', () => {
    const app = { set: vi.fn() };

    applyTrustProxy(app as never, false);

    expect(app.set).not.toHaveBeenCalled();
  });
});
