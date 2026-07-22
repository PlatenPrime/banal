import { ProxyTracerProvider, trace, type Tracer } from '@opentelemetry/api';

/** Default tracer name for the API process (swap provider later without renaming). */
export const API_TRACER_NAME = 'apps/api';

/**
 * Registers a noop TracerProvider so the app boots with an OTel hook.
 * ProxyTracerProvider with no SDK delegate yields no-op spans; replace later
 * via `trace.setGlobalTracerProvider(sdkProvider)` when real tracing lands.
 *
 * @returns whether the global provider was newly registered
 */
export function initOtelNoop(): boolean {
  return trace.setGlobalTracerProvider(new ProxyTracerProvider());
}

/** Tracer bound to the global (noop or future SDK) provider. */
export function getApiTracer(name: string = API_TRACER_NAME): Tracer {
  return trace.getTracer(name);
}
