import { trace } from '@opentelemetry/api';
import { REQUEST_ID_SPAN_ATTRIBUTE } from './otel';

/**
 * Sets `request.id` on the active span when one exists (no-op otherwise).
 */
export function attachRequestIdToActiveSpan(requestId: string): void {
  if (!requestId) {
    return;
  }

  const span = trace.getActiveSpan();
  if (span === undefined) {
    return;
  }

  span.setAttribute(REQUEST_ID_SPAN_ATTRIBUTE, requestId);
}
