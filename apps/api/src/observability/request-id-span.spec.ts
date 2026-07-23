import { trace, type Span } from '@opentelemetry/api';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { REQUEST_ID_SPAN_ATTRIBUTE } from './otel';
import { attachRequestIdToActiveSpan } from './request-id-span';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('attachRequestIdToActiveSpan', () => {
  it('is a no-op when there is no active span', () => {
    vi.spyOn(trace, 'getActiveSpan').mockReturnValue(undefined);
    expect(() => attachRequestIdToActiveSpan('corr-1')).not.toThrow();
  });

  it('is a no-op for an empty request id', () => {
    const setAttribute = vi.fn();
    vi.spyOn(trace, 'getActiveSpan').mockReturnValue({ setAttribute } as unknown as Span);

    attachRequestIdToActiveSpan('');

    expect(setAttribute).not.toHaveBeenCalled();
  });

  it('sets request.id on the active span', () => {
    const setAttribute = vi.fn();
    vi.spyOn(trace, 'getActiveSpan').mockReturnValue({ setAttribute } as unknown as Span);

    attachRequestIdToActiveSpan('corr-abc_123');

    expect(setAttribute).toHaveBeenCalledWith(REQUEST_ID_SPAN_ATTRIBUTE, 'corr-abc_123');
  });
});
