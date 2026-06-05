import { z, registry } from '../../schemas/registry';
import { UUIDSchema } from '../../schemas/common';

export const RoleParams = z.object({
  roleId: UUIDSchema,
});

export const CreateRoleBody = z.object({
  name: z.string().min(1).openapi({ example: 'Admin' }),
  parentRoleId: UUIDSchema.optional().nullable(),
  color: z.string().optional().openapi({ example: '#FF0000' }),
  permissions: z.array(z.string()).optional(),
});

export const UpdateRoleBody = z.object({
  name: z.string().min(1).optional().openapi({ example: 'Admin' }),
  parentRoleId: UUIDSchema.optional().nullable(),
  color: z.string().optional().openapi({ example: '#FF0000' }),
  permissions: z.array(z.string()).optional(),
});

export const RemovePermissionsBody = z.object({
  permissions: z
    .array(z.string())
    .openapi({ example: ['org:read', 'org:write'] }),
});

export const Role = registry.register(
  'Role',
  z.object({
    idRole: UUIDSchema,
    name: z.string().openapi({ example: 'Admin' }),
    parentRoleId: UUIDSchema.nullable().optional(),
    color: z.string().nullable().optional(),
    permissions: z.array(z.string()).optional(),
    createdAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
    updatedAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
  }),
);

export const RolePage = registry.register(
  'RolePage',
  z.object({
    items: z.array(Role),
    total: z.number().int().openapi({ example: 5 }),
    hasNext: z.boolean().openapi({ example: false }),
    totalPages: z.number().int().openapi({ example: 1 }),
  }),
);

export const CreateRoleResponse = registry.register(
  'CreateRoleResponse',
  z.object({ role: Role }),
);

export const UpdateRoleResponse = registry.register(
  'UpdateRoleResponse',
  z.object({ role: Role }),
);
