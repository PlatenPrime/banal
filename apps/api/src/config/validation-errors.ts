import type { ValidationError } from 'class-validator';

/**
 * Flattens class-validator ValidationError trees into RFC 9457-style field errors:
 * property path → list of constraint messages.
 */
export function mapValidationErrors(
  errors: ValidationError[],
  parentPath = '',
): Record<string, string[]> {
  const result: Record<string, string[]> = {};

  for (const error of errors) {
    const path = parentPath ? `${parentPath}.${error.property}` : error.property;

    if (error.constraints) {
      const messages = Object.values(error.constraints);
      if (messages.length > 0) {
        result[path] = [...(result[path] ?? []), ...messages];
      }
    }

    if (error.children && error.children.length > 0) {
      const nested = mapValidationErrors(error.children, path);
      for (const [key, messages] of Object.entries(nested)) {
        result[key] = [...(result[key] ?? []), ...messages];
      }
    }
  }

  return result;
}
