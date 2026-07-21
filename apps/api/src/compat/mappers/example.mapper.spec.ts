import { exampleDtoSchema } from '@app/shared-contracts';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExampleMappableDocument } from '../legacy-types/example.document';
import { toExampleDto, toWriteDoc } from './example.mapper';

const legacyFixture = JSON.parse(
  readFileSync(join(__dirname, '../../../test/fixtures/legacy-example.json'), 'utf8'),
) as ExampleMappableDocument;

describe('example.mapper', () => {
  it('maps a legacy fixture to ExampleDto', () => {
    const dto = toExampleDto(legacyFixture);

    expect(exampleDtoSchema.parse(dto)).toEqual({
      id: '507f1f77bcf86cd799439011',
      name: 'Legacy sample',
      description: 'Synthetic fixture for compat mapper tests',
      createdAt: '2024-01-15T10:30:00.000Z',
    });
  });

  it('ignores unknown legacy fields when mapping to DTO', () => {
    const dto = toExampleDto(legacyFixture);

    expect(dto).not.toHaveProperty('legacyVersion');
  });

  it('maps null description to null in DTO', () => {
    const dto = toExampleDto({
      _id: '1',
      name: 'No description',
      description: null,
      createdAt: '2024-01-01T00:00:00.000Z',
    });

    expect(dto.description).toBeNull();
  });

  it('maps create request to legacy write document', () => {
    const writeDoc = toWriteDoc({ name: 'New', description: 'Optional' });

    expect(writeDoc).toMatchObject({
      name: 'New',
      description: 'Optional',
    });
    expect(writeDoc.createdAt).toBeInstanceOf(Date);
  });
});
