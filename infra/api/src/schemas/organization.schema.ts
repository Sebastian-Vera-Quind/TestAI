import { z, registry } from './registry';
import { UUIDSchema, pageOf } from './common';

export const OrgParamsSchema = z.object({
  organizationId: UUIDSchema,
});

export const CreateOrganizationBodySchema = z.object({
  name: z.string().min(1).openapi({ example: 'Acme Corp' }),
});

export const EditOrganizationBodySchema = z.object({
  name: z.string().min(1).openapi({ example: 'Acme Corp Updated' }),
});

export const AddMemberBodySchema = z.object({
  email: z.string().email().openapi({ example: 'member@example.com' }),
  roleId: UUIDSchema,
});

export const RemoveMemberBodySchema = z.object({
  userId: UUIDSchema,
});

export const SearchOrgQuerySchema = z.object({
  name: z.string().min(1).openapi({ example: 'Acme' }),
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({ example: 1 }),
});

export const ListOrgQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({ example: 1 }),
});

export const OrganizationSchema = registry.register(
  'Organization',
  z.object({
    idOrganization: UUIDSchema,
    name: z.string().openapi({ example: 'Acme Corp' }),
    isFavorite: z.boolean().openapi({ example: false }),
    createdAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
    updatedAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
  }),
);

export const OrganizationPageSchema = registry.register(
  'OrganizationPage',
  pageOf(OrganizationSchema),
);

export const MemberSchema = registry.register(
  'Member',
  z.object({
    idUser: UUIDSchema,
    email: z.email().openapi({ example: 'member@example.com' }),
    name: z.string().openapi({ example: 'Jane Doe' }),
    imageUrl: z.string().nullable().optional(),
    roleId: UUIDSchema,
  }),
);
