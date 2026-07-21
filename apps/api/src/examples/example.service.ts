import { Injectable } from '@nestjs/common';
import type { ExampleDto, ExampleListResponse } from '@app/shared-contracts';
import type { ExampleMappableDocument } from '../compat/legacy-types/example.document';
import { toExampleDto, toWriteDoc } from '../compat/mappers/example.mapper';
import type { CreateExampleDto } from './create-example.dto';
import { ExampleRepository } from './example.repository';

/** Service contract for the examples resource. */
export interface IExamplesService {
  findAll(): ExampleListResponse | Promise<ExampleListResponse>;
  create(dto: CreateExampleDto): ExampleDto | Promise<ExampleDto>;
}

@Injectable()
export class ExamplesService implements IExamplesService {
  constructor(private readonly repository: ExampleRepository) {}

  async findAll(): Promise<ExampleListResponse> {
    const docs = await this.repository.findAll();
    const items = docs.map((doc) => toExampleDto(doc as unknown as ExampleMappableDocument));

    return { items, total: items.length };
  }

  async create(dto: CreateExampleDto): Promise<ExampleDto> {
    const doc = await this.repository.create(toWriteDoc(dto));
    return toExampleDto(doc as unknown as ExampleMappableDocument);
  }
}
