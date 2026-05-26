import { z, registry } from './registry';

export const UUIDSchema = z.uuid().openapi({
  description: 'UUID v4',
  example: 'a6e7e1c4-1b2c-4d5e-8f9a-0b1c2d3e4f5a',
});

export const ErrorResponseSchema = registry.register(
  'ErrorResponse',
  z.object({
    error: z.string().openapi({ example: 'DataError' }),
    message: z.string().openapi({ example: 'Validation failed' }),
    code: z.number().optional().openapi({ example: 400 }),
  }),
);

export function pageOf<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    total: z.number().int().openapi({ example: 10 }),
    hasNext: z.boolean().openapi({ example: false }),
    totalPages: z.number().int().openapi({ example: 1 }),
  });
}
