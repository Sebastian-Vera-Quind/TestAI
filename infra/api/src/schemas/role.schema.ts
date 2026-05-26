import { z, registry } from './registry';
import { UUIDSchema } from './common';

export const RoleParamsSchema = z.object({
  roleId: UUIDSchema,
});

export const RoleOrgParamsSchema = z.object({
  organizationId: UUIDSchema,
});

export const CreateRoleBodySchema = z.object({
  name: z.string().min(1).openapi({ example: 'Manager' }),
  parentRoleId: UUIDSchema,
  color: z.string().optional().openapi({ example: '#FF5733' }),
  permissions: z
    .array(z.string())
    .optional()
    .openapi({ example: ['Organization:Read', 'Organization:Write'] }),
});

export const UpdateRoleBodySchema = z.object({
  name: z.string().optional().openapi({ example: 'Senior Manager' }),
  parentRoleId: UUIDSchema.optional(),
  color: z.string().optional().openapi({ example: '#33FF57' }),
  permissions: z
    .array(z.string())
    .optional()
    .openapi({ example: ['Organization:Read'] }),
});

export const RemovePermissionsBodySchema = z.object({
  permissions: z
    .array(z.string())
    .min(1)
    .openapi({ example: ['Organization:Write'] }),
});

export const RoleSchema = registry.register(
  'Role',
  z.object({
    idRole: UUIDSchema,
    name: z.string().openapi({ example: 'Manager' }),
    color: z.string().nullable().optional().openapi({ example: '#FF5733' }),
    permissions: z
      .array(z.string())
      .openapi({ example: ['Organization:Read'] }),
    parentRoleId: UUIDSchema.nullable().optional(),
    createdAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
    updatedAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
  }),
);
