import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { createOpenApiDocument } from './create-openapi-document';

/** Committed OpenAPI artifact relative to the api project root (`apps/api`). */
export const OPENAPI_JSON_RELATIVE_PATH = join('openapi', 'openapi.json');

export function resolveOpenApiJsonPath(apiProjectRoot: string = process.cwd()): string {
  return join(apiProjectRoot, OPENAPI_JSON_RELATIVE_PATH);
}

/**
 * Builds the OpenAPI document and writes `openapi/openapi.json` under the api project root.
 * @returns Absolute path of the written file.
 */
export async function writeOpenApiJson(apiProjectRoot: string = process.cwd()): Promise<string> {
  const document = await createOpenApiDocument();
  const outputPath = resolveOpenApiJsonPath(apiProjectRoot);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8');
  return outputPath;
}
