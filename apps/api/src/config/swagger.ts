import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

/** Path segment under the global API prefix → `/api/docs`. */
export const SWAGGER_PATH = 'docs';

export const SWAGGER_TITLE = 'Banal API';
export const SWAGGER_VERSION = '1';

/**
 * Mounts Swagger UI at `/api/docs` and OpenAPI JSON at `/api/docs-json`.
 * Call after URI versioning so paths reflect `/api/v1/...`.
 */
export function applySwaggerDocs(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription('Foundation API OpenAPI stub')
    .setVersion(SWAGGER_VERSION)
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    useGlobalPrefix: true,
  });
}
