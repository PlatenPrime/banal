import { trace } from '@opentelemetry/api';
import { afterEach, describe, expect, it } from 'vitest';
import { API_TRACER_NAME, getApiTracer, initOtelNoop } from './otel-noop';

afterEach(() => {
  trace.disable();
});

describe('initOtelNoop', () => {
  it('registers a global TracerProvider and returns true on first call', () => {
    expect(initOtelNoop()).toBe(true);
    expect(trace.getTracerProvider()).toBeDefined();
  });

  it('allows startSpan/end without throwing (noop spans)', () => {
    initOtelNoop();
    const tracer = getApiTracer();
    const span = tracer.startSpan('boot');

    expect(() => {
      span.setAttribute('service', API_TRACER_NAME);
      span.end();
    }).not.toThrow();
  });
});
