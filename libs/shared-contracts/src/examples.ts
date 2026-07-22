import { z } from 'zod';

export const createExampleRequestSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
});

export const exampleDtoSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  createdAt: z.iso.datetime(),
});

export const exampleListResponseSchema = z.object({
  items: z.array(exampleDtoSchema),
  total: z.number().int().nonnegative(),
});

export type CreateExampleRequest = z.infer<typeof createExampleRequestSchema>;
export type ExampleDto = z.infer<typeof exampleDtoSchema>;
export type ExampleListResponse = z.infer<typeof exampleListResponseSchema>;
