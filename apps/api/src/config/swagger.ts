import { type INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule, type OpenAPIObject } from '@nestjs/swagger';
import { ExampleListResponseDto, ExampleResponseDto } from '../examples/example-response.dto';
import { HealthCheckResultDto } from '../health/health-response.dto';

/** Path segment under the global API prefix → `/api/docs`. */
export const SWAGGER_PATH = 'docs';

export const SWAGGER_TITLE = 'Banal API';
export const SWAGGER_VERSION = '1';

/**
 * Builds the OpenAPI document for the given Nest app (no HTTP listen required).
 * Call after URI versioning so paths reflect `/api/v1/...`.
 */
export function buildOpenApiDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle(SWAGGER_TITLE)
    .setDescription('Foundation API OpenAPI stub')
    .setVersion(SWAGGER_VERSION)
    .build();

  return SwaggerModule.createDocument(app, config, {
    extraModels: [ExampleResponseDto, ExampleListResponseDto, HealthCheckResultDto],
  });
}

/**
 * Mounts Swagger UI at `/api/docs` and OpenAPI JSON at `/api/docs-json`.
 * Call after URI versioning so paths reflect `/api/v1/...`.
 */
export function applySwaggerDocs(app: INestApplication): void {
  const document = buildOpenApiDocument(app);
  SwaggerModule.setup(SWAGGER_PATH, app, document, {
    useGlobalPrefix: true,
  });
}
