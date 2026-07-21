import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExamplesService } from './example.service';

describe('ExamplesService', () => {
  let service: ExamplesService;
  let repository: {
    findAll: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    repository = {
      findAll: vi.fn(),
      create: vi.fn(),
    };
    service = new ExamplesService(repository as never);
  });

  it('findAll maps repository documents to ExampleListResponse', async () => {
    repository.findAll.mockResolvedValue([
      {
        _id: '507f1f77bcf86cd799439011',
        name: 'Demo',
        description: 'Test',
        createdAt: new Date('2024-01-15T10:30:00.000Z'),
      },
    ]);

    await expect(service.findAll()).resolves.toEqual({
      items: [
        {
          id: '507f1f77bcf86cd799439011',
          name: 'Demo',
          description: 'Test',
          createdAt: '2024-01-15T10:30:00.000Z',
        },
      ],
      total: 1,
    });
  });

  it('create persists via repository and returns ExampleDto', async () => {
    repository.create.mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'New',
      createdAt: new Date('2024-01-15T10:30:00.000Z'),
    });

    await expect(service.create({ name: 'New' } as never)).resolves.toMatchObject({
      id: '507f1f77bcf86cd799439011',
      name: 'New',
    });
    expect(repository.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'New', createdAt: expect.any(Date) }),
    );
  });
});
