import { Injectable, NotImplementedException } from '@nestjs/common';
import type { ExampleListResponse } from '@app/shared-contracts';
import type { CreateExampleDto } from './create-example.dto';

/** Service contract for the examples resource (persistence lands in T4). */
export interface IExamplesService {
  findAll(): ExampleListResponse | Promise<ExampleListResponse>;
  create(dto: CreateExampleDto): never | Promise<never>;
}

@Injectable()
export class ExamplesService implements IExamplesService {
  findAll(): ExampleListResponse {
    return { items: [], total: 0 };
  }

  /** Persistence lands in step 055; validation of `dto` is the 042 concern. */
  create(_dto: CreateExampleDto): never {
    throw new NotImplementedException('Example create is not implemented yet');
  }
}
