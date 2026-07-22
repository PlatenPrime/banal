/**
 * CLI entry: nest build → node dist/openapi/export-openapi.cli.js
 * Writes apps/api/openapi/openapi.json (cwd = apps/api when invoked via nest/node).
 */
import 'reflect-metadata';
import { writeOpenApiJson } from './write-openapi-json';

async function main(): Promise<void> {
  const outputPath = await writeOpenApiJson(process.cwd());
  console.log(`OpenAPI written to ${outputPath}`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
