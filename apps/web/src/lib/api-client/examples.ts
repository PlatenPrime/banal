import {
  createExampleRequestSchema,
  exampleDtoSchema,
  exampleListResponseSchema,
  type CreateExampleRequest,
  type ExampleDto,
  type ExampleListResponse,
} from '@app/shared-contracts';
import { request } from './client';

export async function fetchExamples(): Promise<ExampleListResponse> {
  return request('/api/v1/examples', exampleListResponseSchema);
}

export async function createExample(body: CreateExampleRequest): Promise<ExampleDto> {
  const payload = createExampleRequestSchema.parse(body);
  return request('/api/v1/examples', exampleDtoSchema, {
    method: 'POST',
    body: payload,
  });
}
