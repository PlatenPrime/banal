import { describe, it } from 'vitest';

/**
 * Health e2e — full Vitest e2e runner lands in Track 6 (070).
 * Stub kept here so the health surface is tracked from steps 036–038.
 */
describe('Health (e2e stub)', () => {
  it.todo('GET /health returns 200 with contract liveness body');
  it.todo('GET /health/ready returns 503 until Mongo is connected');
});
