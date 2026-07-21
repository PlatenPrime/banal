import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ExampleRepository } from './example.repository';

describe('ExampleRepository', () => {
  let repository: ExampleRepository;
  let model: {
    find: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    const sort = vi.fn().mockReturnValue({ exec: vi.fn().mockResolvedValue([]) });
    model = {
      find: vi.fn().mockReturnValue({ sort }),
      create: vi.fn(),
    };
    repository = new ExampleRepository(model as never);
  });

  it('findAll returns documents sorted by createdAt desc', async () => {
    const doc = { name: 'Demo' };
    const exec = vi.fn().mockResolvedValue([doc]);
    const sort = vi.fn().mockReturnValue({ exec });
    model.find.mockReturnValue({ sort });

    await expect(repository.findAll()).resolves.toEqual([doc]);
    expect(model.find).toHaveBeenCalledWith();
    expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  });

  it('create inserts into the foundation collection model', async () => {
    const writeDoc = { name: 'Demo', createdAt: new Date('2024-01-01T00:00:00.000Z') };
    const created = { _id: '1', ...writeDoc };
    model.create.mockResolvedValue(created);

    await expect(repository.create(writeDoc)).resolves.toEqual(created);
    expect(model.create).toHaveBeenCalledWith(writeDoc);
  });
});
