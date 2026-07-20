import { describe, it } from 'vitest';
import { apiV1Path } from '../src/config/api-versioning';

/**
 * URI versioning e2e — full Vitest e2e runner lands in Track 6 (070).
 * Stub kept here so the versioned route surface is tracked from step 034.
 */
describe('URI versioning (e2e stub)', () => {
  it.todo(`serves versioned routes under ${apiV1Path()}`);
});
