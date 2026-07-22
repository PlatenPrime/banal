import { NestFactory } from '@nestjs/core';
import type { OpenAPIObject } from '@nestjs/swagger';
import { applyApiUriVersioning } from '../config/api-versioning';
import { buildOpenApiDocument } from '../config/swagger';
import { OpenApiExportModule } from './openapi-export.module';

/**
 * Boots a Mongo-free Nest app and returns the OpenAPI document.
 * Does not listen on a port.
 */
export async function createOpenApiDocument(): Promise<OpenAPIObject> {
  const app = await NestFactory.create(OpenApiExportModule, {
    logger: false,
    abortOnError: false,
  });

  applyApiUriVersioning(app);
  await app.init();

  try {
    return buildOpenApiDocument(app);
  } finally {
    await app.close();
  }
}
