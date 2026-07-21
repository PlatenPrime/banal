import { exampleDtoSchema, exampleListResponseSchema } from '@app/shared-contracts';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CreateExampleDto } from './create-example.dto';
import { ExamplesController } from './example.controller';
import { ExamplesService } from './example.service';

describe('ExamplesController', () => {
  let controller: ExamplesController;
  const examplesService = {
    findAll: vi.fn(),
    create: vi.fn(),
  };

  beforeEach(async () => {
    examplesService.findAll.mockReset();
    examplesService.create.mockReset();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExamplesController],
      providers: [{ provide: ExamplesService, useValue: examplesService }],
    }).compile();

    controller = module.get(ExamplesController);
  });

  it('findAll returns list from service matching exampleListResponseSchema', async () => {
    const payload = { items: [], total: 0 };
    examplesService.findAll.mockResolvedValue(payload);

    await expect(controller.findAll()).resolves.toEqual(payload);
    expect(exampleListResponseSchema.parse(payload)).toEqual(payload);
  });

  it('create returns 201 payload from service for a valid dto', async () => {
    const dto = Object.assign(new CreateExampleDto(), {
      name: 'Demo',
      description: 'Foundation example',
    });
    const created = {
      id: '507f1f77bcf86cd799439011',
      name: 'Demo',
      description: 'Foundation example',
      createdAt: '2024-01-15T10:30:00.000Z',
    };
    examplesService.create.mockResolvedValue(created);

    await expect(controller.create(dto)).resolves.toEqual(exampleDtoSchema.parse(created));
    expect(examplesService.create).toHaveBeenCalledWith(dto);
  });
});
