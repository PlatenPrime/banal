import {
  createExampleRequestSchema,
  exampleDtoSchema,
  exampleListResponseSchema,
  type CreateExampleRequest,
  type ExampleDto,
  type ExampleListResponse,
} from '@app/shared-contracts';
import { getApiClient, unwrapApiResult } from './create-api-client';

export async function fetchExamples(): Promise<ExampleListResponse> {
  const data = await unwrapApiResult(await getApiClient().GET('/api/v1/examples'));
  return exampleListResponseSchema.parse(data);
}

export async function createExample(body: CreateExampleRequest): Promise<ExampleDto> {
  const payload = createExampleRequestSchema.parse(body);
  const data = await unwrapApiResult(
    await getApiClient().POST('/api/v1/examples', { body: payload }),
  );
  return exampleDtoSchema.parse(data);
}
