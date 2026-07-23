import { afterEach, describe, expect, it, vi } from 'vitest';
import { trace } from '@opentelemetry/api';
import { initOtelNoop } from './otel-noop';
import { initOtelFromEnv, isOtelEnabledFromEnv } from './otel';

afterEach(() => {
  trace.disable();
  vi.unstubAllEnvs();
});

describe('isOtelEnabledFromEnv', () => {
  it('treats unset/empty/false as disabled', () => {
    expect(isOtelEnabledFromEnv(undefined)).toBe(false);
    expect(isOtelEnabledFromEnv('')).toBe(false);
    expect(isOtelEnabledFromEnv('false')).toBe(false);
    expect(isOtelEnabledFromEnv('0')).toBe(false);
  });

  it('treats true/1/TRUE as enabled', () => {
    expect(isOtelEnabledFromEnv('true')).toBe(true);
    expect(isOtelEnabledFromEnv('1')).toBe(true);
    expect(isOtelEnabledFromEnv('TRUE')).toBe(true);
  });
});

describe('initOtelFromEnv', () => {
  it('uses noop when OTEL is disabled (default)', async () => {
    const startSdk = vi.fn(async () => async () => undefined);

    const handle = await initOtelFromEnv({
      enabled: false,
      startSdk,
    });

    expect(handle.mode).toBe('noop');
    expect(startSdk).not.toHaveBeenCalled();
    expect(trace.getTracerProvider()).toBeDefined();
  });

  it('uses noop when enabled but endpoint is missing (Zod fails later)', async () => {
    const startSdk = vi.fn(async () => async () => undefined);

    const handle = await initOtelFromEnv({
      enabled: true,
      endpoint: '',
      startSdk,
    });

    expect(handle.mode).toBe('noop');
    expect(startSdk).not.toHaveBeenCalled();
  });

  it('starts SDK when enabled with endpoint and does not throw', async () => {
    const shutdown = vi.fn(async () => undefined);
    const startSdk = vi.fn(async (endpoint: string) => {
      expect(endpoint).toBe('https://otel.example.com');
      initOtelNoop();
      return shutdown;
    });

    const handle = await initOtelFromEnv({
      enabled: true,
      endpoint: 'https://otel.example.com',
      startSdk,
    });

    expect(handle.mode).toBe('sdk');
    expect(startSdk).toHaveBeenCalledOnce();
    await handle.shutdown();
    expect(shutdown).toHaveBeenCalledOnce();
  });

  it('reads process.env when options omit enabled/endpoint', async () => {
    vi.stubEnv('OTEL_ENABLED', 'false');
    vi.stubEnv('OTEL_EXPORTER_OTLP_ENDPOINT', '');

    const startSdk = vi.fn(async () => async () => undefined);
    const handle = await initOtelFromEnv({ startSdk });

    expect(handle.mode).toBe('noop');
    expect(startSdk).not.toHaveBeenCalled();
  });
});
