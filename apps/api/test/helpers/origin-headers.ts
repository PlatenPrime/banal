export const E2E_WEB_ORIGIN = 'http://localhost:3000';

/** JSON + Origin headers for mutating e2e requests (CSRF Origin middleware). */
export function jsonOriginHeaders(
  origin = E2E_WEB_ORIGIN,
  extra: Record<string, string> = {},
): Record<string, string> {
  return {
    'content-type': 'application/json',
    origin,
    ...extra,
  };
}
