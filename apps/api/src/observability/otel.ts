import { initOtelNoop } from './otel-noop';

/** Span attribute for correlating traces with `x-request-id` / pino `requestId`. */
export const REQUEST_ID_SPAN_ATTRIBUTE = 'request.id';

export type OtelInitMode = 'noop' | 'sdk';

export type OtelHandle = {
  mode: OtelInitMode;
  shutdown: () => Promise<void>;
};

const noopHandle = (): OtelHandle => ({
  mode: 'noop',
  shutdown: async () => undefined,
});

/**
 * Parses env truthy flags the same way as Zod `booleanFromEnv` (without loading Nest).
 */
export function isOtelEnabledFromEnv(
  value: string | undefined = process.env.OTEL_ENABLED,
): boolean {
  if (value === undefined || value === '') {
    return false;
  }

  return value === 'true' || value === '1' || value === 'TRUE';
}

export type InitOtelOptions = {
  enabled?: boolean;
  endpoint?: string;
  /**
   * Injected for unit tests — production path dynamic-imports SDK packages.
   */
  startSdk?: (endpoint: string) => Promise<() => Promise<void>>;
};

async function startOtlpSdk(endpoint: string): Promise<() => Promise<void>> {
  const [{ NodeSDK }, { OTLPTraceExporter }] = await Promise.all([
    import('@opentelemetry/sdk-node'),
    import('@opentelemetry/exporter-trace-otlp-http'),
  ]);

  const sdk = new NodeSDK({
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
  });

  await Promise.resolve(sdk.start());

  return () => Promise.resolve(sdk.shutdown());
}

/**
 * Boots OpenTelemetry before Nest: noop when disabled; optional OTLP HTTP when enabled.
 * Nest Zod env still fail-fasts if `OTEL_ENABLED=true` without an endpoint.
 */
export async function initOtelFromEnv(options: InitOtelOptions = {}): Promise<OtelHandle> {
  const enabled = options.enabled ?? isOtelEnabledFromEnv();
  const endpoint = options.endpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT?.trim() ?? '';

  if (!enabled) {
    initOtelNoop();
    return noopHandle();
  }

  if (!endpoint) {
    // Safe boot path; ConfigModule validate() rejects this combo later.
    initOtelNoop();
    return noopHandle();
  }

  const startSdk = options.startSdk ?? startOtlpSdk;
  const shutdown = await startSdk(endpoint);

  return {
    mode: 'sdk',
    shutdown,
  };
}
