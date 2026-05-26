import { z, registry } from './registry';
import { UUIDSchema } from './common';

export const CreateUserBodySchema = z.object({
  name: z.string().min(1).openapi({ example: 'John Doe' }),
  email: z.email().openapi({ example: 'john@example.com' }),
  imageUrl: z
    .url()
    .optional()
    .openapi({ example: 'https://example.com/avatar.jpg' }),
});

export const UserSchema = registry.register(
  'User',
  z.object({
    idUser: UUIDSchema,
    email: z.email().openapi({ example: 'john@example.com' }),
    name: z.string().openapi({ example: 'John Doe' }),
    imageUrl: z.string().nullable().optional(),
  }),
);
