import { exampleListResponseSchema } from '@app/shared-contracts';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { ExamplesController } from './example.controller';
import { ExamplesService } from './example.service';

describe('ExamplesController', () => {
  let controller: ExamplesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamplesController],
      providers: [ExamplesService],
    }).compile();

    controller = module.get(ExamplesController);
  });

  it('findAll returns an empty list matching exampleListResponseSchema', () => {
    const body = controller.findAll();

    expect(exampleListResponseSchema.parse(body)).toEqual({
      items: [],
      total: 0,
    });
  });
});
