import { z, registry } from '../../schemas/registry';
import { UUIDSchema, pageOf } from '../../schemas/common';

export const OrgParams = z.object({
  organizationId: UUIDSchema,
});

export const OrganizationCreateBody = z.object({
  name: z.string().min(1).openapi({ example: 'Acme Corp' }),
});

export const AddMemberBody = z.object({
  email: z.email().openapi({ example: 'member@example.com' }),
  roleId: UUIDSchema,
});

export const RemoveMemberBody = z.object({
  userId: UUIDSchema,
});

export const ListOrgQuery = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({ example: 1 }),
});

export const SearchOrgQuery = ListOrgQuery.extend({
  name: z.string().min(1).openapi({ example: 'Acme' }),
});

export const Organization = registry.register(
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

export const OrganizationPage = registry.register(
  'OrganizationPage',
  pageOf(Organization),
);

export const Member = registry.register(
  'Member',
  z.object({
    idUser: UUIDSchema,
    email: z.email().openapi({ example: 'member@example.com' }),
    name: z.string().openapi({ example: 'Jane Doe' }),
    imageUrl: z.string().nullable().optional(),
    roleId: UUIDSchema,
  }),
);

export const FavoriteOrganization = registry.register(
  'FavoriteOrganization',
  z.object({
    isFavorite: z.boolean().openapi({ example: true }),
  }),
);

export const CreateOrganizationResponse = registry.register(
  'CreateOrganizationResponse',
  z.object({
    organization: Organization,
  }),
);

export const UpdateOrganizationResponse = registry.register(
  'UpdateOrganizationResponse',
  z.object({
    organization: Organization,
  }),
);

export const CreateMemberResponse = registry.register(
  'CreateMemberResponse',
  z.object({
    member: Member,
  }),
);
