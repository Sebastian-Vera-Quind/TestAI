import { z, registry } from '../../schemas/registry';
import { UUIDSchema } from '../../schemas/common';

export const CreateUserBody = z.object({
  name: z.string().min(1).openapi({ example: 'John Doe' }),
  email: z.email().openapi({ example: 'john.doe@example.com' }),
});

export const UserSchema = registry.register(
  'User',
  z.object({
    idUser: UUIDSchema,
    email: z.email().openapi({ example: 'john.doe@example.com' }),
    name: z.string().openapi({ example: 'John Doe' }),
    imageUrl: z
      .string()
      .nullable()
      .optional()
      .openapi({ example: 'https://example.com/avatar.jpg' }),
  }),
);
