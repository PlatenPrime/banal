import type { LivenessResponse, ReadinessResponse } from '@app/shared-contracts';
import type { HealthCheckResult } from '@nestjs/terminus';

type TerminusIndicatorEntry = {
  status: 'up' | 'down';
  message?: string;
  [key: string]: unknown;
};

function mapIndicatorStatus(status: 'up' | 'down'): 'ok' | 'error' {
  return status === 'up' ? 'ok' : 'error';
}

function mapIndicatorEntry(entry: TerminusIndicatorEntry): {
  status: 'ok' | 'error';
  detail?: string;
} {
  const mapped: { status: 'ok' | 'error'; detail?: string } = {
    status: mapIndicatorStatus(entry.status),
  };

  if (typeof entry.message === 'string' && entry.message.length > 0) {
    mapped.detail = entry.message;
  }

  return mapped;
}

function mapIndicatorRecord(
  record: Record<string, TerminusIndicatorEntry> | undefined,
): Record<string, { status: 'ok' | 'error'; detail?: string }> | undefined {
  if (!record || Object.keys(record).length === 0) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(record).map(([key, value]) => [key, mapIndicatorEntry(value)]),
  );
}

/** Collapse Terminus liveness to the shared-contracts shape. */
export function toLivenessResponse(result: HealthCheckResult): LivenessResponse {
  if (result.status !== 'ok') {
    throw new Error('Liveness check must be ok before mapping to LivenessResponse');
  }

  return { status: 'ok' };
}

/** Map Terminus readiness payload to shared-contracts ReadinessResponse. */
export function toReadinessResponse(result: HealthCheckResult): ReadinessResponse {
  const status = result.status === 'ok' ? 'ok' : 'error';

  return {
    status,
    info: mapIndicatorRecord(result.info as Record<string, TerminusIndicatorEntry> | undefined),
    error: mapIndicatorRecord(result.error as Record<string, TerminusIndicatorEntry> | undefined),
    details: mapIndicatorRecord(
      result.details as Record<string, TerminusIndicatorEntry> | undefined,
    ),
  };
}
