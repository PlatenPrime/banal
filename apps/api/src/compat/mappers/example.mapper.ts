import type { CreateExampleRequest, ExampleDto } from '@app/shared-contracts';
import type {
  ExampleMappableDocument,
  LegacyExampleWriteDocument,
} from '../legacy-types/example.document';

function resolveDocumentId(doc: ExampleMappableDocument): string {
  const { _id } = doc;

  if (typeof _id === 'object' && _id !== null && 'toString' in _id) {
    return _id.toString();
  }

  return String(_id);
}

function resolveCreatedAt(createdAt: Date | string): string {
  if (createdAt instanceof Date) {
    return createdAt.toISOString();
  }

  return new Date(createdAt).toISOString();
}

/** Maps a legacy Mongo document to the shared ExampleDto contract. */
export function toExampleDto(doc: ExampleMappableDocument): ExampleDto {
  return {
    id: resolveDocumentId(doc),
    name: doc.name,
    description: doc.description ?? null,
    createdAt: resolveCreatedAt(doc.createdAt),
  };
}

/** Maps a create request to the legacy write document shape. */
export function toWriteDoc(dto: CreateExampleRequest): LegacyExampleWriteDocument {
  return {
    name: dto.name,
    description: dto.description,
    createdAt: new Date(),
  };
}
