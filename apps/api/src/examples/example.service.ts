import { Injectable } from '@nestjs/common';
import type { ExampleListResponse } from '@app/shared-contracts';

/** Service contract for the examples resource (persistence lands in T4). */
export interface IExamplesService {
  findAll(): ExampleListResponse | Promise<ExampleListResponse>;
}

@Injectable()
export class ExamplesService implements IExamplesService {
  findAll(): ExampleListResponse {
    return { items: [], total: 0 };
  }
}
