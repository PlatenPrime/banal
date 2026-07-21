import { describe, expect, it } from 'vitest';
import { ExampleSchema, FOUNDATION_EXAMPLES_COLLECTION } from './example.schema';

describe('ExampleSchema', () => {
  it('targets the foundation examples collection', () => {
    expect(ExampleSchema.get('collection')).toBe(FOUNDATION_EXAMPLES_COLLECTION);
  });

  it('requires name and createdAt paths', () => {
    const paths = ExampleSchema.paths;

    expect(paths.name?.isRequired).toBe(true);
    expect(paths.createdAt?.isRequired).toBe(true);
    expect(paths.description?.isRequired ?? false).toBe(false);
  });
});
