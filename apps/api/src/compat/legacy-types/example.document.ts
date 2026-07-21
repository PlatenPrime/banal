/** Raw Mongo document shape for `_foundation_examples` (legacy-compatible). */
export interface LegacyExampleDocument {
  _id: string | { toString(): string };
  name: string;
  description?: string | null;
  createdAt: Date | string;
}

/** Document accepted by compat mappers (includes unknown legacy fields at runtime). */
export type ExampleMappableDocument = LegacyExampleDocument & Record<string, unknown>;

/** Write payload stored in Mongo before mapping back to DTO. */
export interface LegacyExampleWriteDocument {
  name: string;
  description?: string;
  createdAt: Date;
}
