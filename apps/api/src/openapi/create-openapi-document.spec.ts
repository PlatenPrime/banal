import { describe, expect, it } from 'vitest';
import { createOpenApiDocument } from './create-openapi-document';

describe('createOpenApiDocument', () => {
  it('includes versioned examples paths and response schemas', async () => {
    const document = await createOpenApiDocument();

    expect(document.openapi).toMatch(/^3\./);
    expect(document.info.title).toBe('Banal API');

    const paths = document.paths ?? {};
    expect(paths['/api/v1/examples']).toBeTypeOf('object');
    expect(paths['/api/v1/examples']?.get).toBeTypeOf('object');
    expect(paths['/api/v1/examples']?.post).toBeTypeOf('object');
    expect(paths['/health']).toBeTypeOf('object');
    expect(paths['/health/ready']).toBeTypeOf('object');

    const schemas = document.components?.schemas ?? {};
    expect(schemas).toHaveProperty('CreateExampleDto');
    expect(schemas).toHaveProperty('ExampleResponseDto');
    expect(schemas).toHaveProperty('ExampleListResponseDto');
  });
});
