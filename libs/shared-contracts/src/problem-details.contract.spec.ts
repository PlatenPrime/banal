import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { errorTypeUriSchema } from './error-codes';
import { problemDetailsSchema } from './problem-details';

const fixturesDir = join(__dirname, 'fixtures', 'problem-details');

function loadFixture(name: string): unknown {
  return JSON.parse(readFileSync(join(fixturesDir, name), 'utf8')) as unknown;
}

const CANONICAL_FIXTURES = [
  'not-found-minimal.json',
  'not-found-with-instance.json',
  'validation-failed.json',
  'internal.json',
  'unauthorized.json',
  'forbidden.json',
  'conflict.json',
] as const;

describe('Problem Details error JSON contract', () => {
  it.each(CANONICAL_FIXTURES)('locks canonical shape for %s', (fixtureName) => {
    const raw = loadFixture(fixtureName);
    const problem = problemDetailsSchema.parse(raw);

    expect(errorTypeUriSchema.safeParse(problem.type).success).toBe(true);
    expect(problem).not.toHaveProperty('stack');
    expect(problem).toMatchSnapshot();
  });

  it('rejects fixtures with a non-URI type', () => {
    const raw = loadFixture('anti-invalid-type.json');

    expect(problemDetailsSchema.safeParse(raw).success).toBe(false);
  });

  it('accepts RFC shape but rejects unknown type URIs from the catalog', () => {
    const raw = loadFixture('anti-unknown-type-uri.json');
    const problem = problemDetailsSchema.parse(raw);

    expect(errorTypeUriSchema.safeParse(problem.type).success).toBe(false);
  });

  it('strips stack leaks so the contract surface stays safe', () => {
    const raw = loadFixture('anti-with-stack.json') as Record<string, unknown>;
    expect(raw).toHaveProperty('stack');

    const problem = problemDetailsSchema.parse(raw);

    expect(problem).not.toHaveProperty('stack');
    expect(JSON.stringify(problem)).not.toContain('secret-db-password-xyz');
    expect(errorTypeUriSchema.safeParse(problem.type).success).toBe(true);
    expect(problem).toMatchSnapshot();
  });
});
