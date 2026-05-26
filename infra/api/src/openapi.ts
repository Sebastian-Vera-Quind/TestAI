import { OpenApiGeneratorV31 } from '@asteasolutions/zod-to-openapi';
import { registry, z } from './schemas/registry';
import { ErrorResponseSchema } from './schemas/common';
import { CreateUserBodySchema, UserSchema } from './schemas/session.schema';
import {
  OrgParamsSchema,
  CreateOrganizationBodySchema,
  EditOrganizationBodySchema,
  AddMemberBodySchema,
  RemoveMemberBodySchema,
  SearchOrgQuerySchema,
  ListOrgQuerySchema,
  OrganizationSchema,
  OrganizationPageSchema,
  MemberSchema,
} from './schemas/organization.schema';
import {
  RoleParamsSchema,
  RoleOrgParamsSchema,
  CreateRoleBodySchema,
  UpdateRoleBodySchema,
  RemovePermissionsBodySchema,
  RoleSchema,
} from './schemas/role.schema';
import {
  DatasourceOrgParamsSchema,
  DatasourceParamsSchema,
  TestConnectionBodySchema,
  CreateDatasourceBodySchema,
  ListDatasourcesQuerySchema,
  DatasourceSchema,
  DatasourcePageSchema,
} from './schemas/datasource.schema';

const userEmailScheme = registry.registerComponent(
  'securitySchemes',
  'UserEmail',
  {
    type: 'apiKey',
    in: 'header',
    name: 'x-user-email',
    description: 'User email for session authentication',
  },
);

const security = [{ [userEmailScheme.name]: [] }];

const errors = {
  400: {
    description: 'Bad request',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Unauthorized',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Forbidden',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Not found',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  500: {
    description: 'Internal server error',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};

// Health
registry.registerPath({
  method: 'get',
  path: '/api/v1/health',
  tags: ['Health'],
  summary: 'Health check',
  responses: {
    200: {
      description: 'Service is healthy',
      content: {
        'application/json': {
          schema: z.object({ status: z.literal('ok') }),
        },
      },
    },
  },
});

// Account
registry.registerPath({
  method: 'post',
  path: '/api/v1/account',
  tags: ['Account'],
  summary: 'Create or update user account',
  request: {
    body: {
      content: { 'application/json': { schema: CreateUserBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Account created or updated',
      content: { 'application/json': { schema: UserSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/account',
  tags: ['Account'],
  summary: 'Get current user',
  security,
  responses: {
    200: {
      description: 'Current user data',
      content: { 'application/json': { schema: UserSchema } },
    },
    ...errors,
  },
});

// Organizations
registry.registerPath({
  method: 'post',
  path: '/api/v1/organizations',
  tags: ['Organizations'],
  summary: 'Create a new organization',
  security,
  request: {
    body: {
      content: {
        'application/json': { schema: CreateOrganizationBodySchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Organization created',
      content: {
        'application/json': {
          schema: z.object({ organization: OrganizationSchema }),
        },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/organizations',
  tags: ['Organizations'],
  summary: 'List organizations for current user',
  security,
  request: { query: ListOrgQuerySchema },
  responses: {
    200: {
      description: 'Paginated list of organizations',
      content: { 'application/json': { schema: OrganizationPageSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/organizations/search',
  tags: ['Organizations'],
  summary: 'Search organizations by name',
  security,
  request: { query: SearchOrgQuerySchema },
  responses: {
    200: {
      description: 'Paginated search results',
      content: { 'application/json': { schema: OrganizationPageSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/organizations/{organizationId}',
  tags: ['Organizations'],
  summary: 'Edit an organization',
  security,
  request: {
    params: OrgParamsSchema,
    body: {
      content: { 'application/json': { schema: EditOrganizationBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Organization updated',
      content: {
        'application/json': {
          schema: z.object({ organization: OrganizationSchema }),
        },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/organizations/{organizationId}/favorite',
  tags: ['Organizations'],
  summary: 'Toggle organization favorite status',
  security,
  request: { params: OrgParamsSchema },
  responses: {
    200: {
      description: 'Favorite status toggled',
      content: {
        'application/json': {
          schema: z.object({
            isFavorite: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/organizations/{organizationId}/members',
  tags: ['Organizations'],
  summary: 'Add a member to an organization',
  security,
  request: {
    params: OrgParamsSchema,
    body: {
      content: { 'application/json': { schema: AddMemberBodySchema } },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Member added',
      content: {
        'application/json': {
          schema: z.object({ member: MemberSchema }),
        },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/organizations/{organizationId}/members',
  tags: ['Organizations'],
  summary: 'Remove a member from an organization',
  security,
  request: {
    params: OrgParamsSchema,
    body: {
      content: { 'application/json': { schema: RemoveMemberBodySchema } },
      required: true,
    },
  },
  responses: {
    204: { description: 'Member removed' },
    ...errors,
  },
});

// Roles
registry.registerPath({
  method: 'post',
  path: '/api/v1/roles/{organizationId}',
  tags: ['Roles'],
  summary: 'Create a new role in an organization',
  security,
  request: {
    params: RoleOrgParamsSchema,
    body: {
      content: { 'application/json': { schema: CreateRoleBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Role created',
      content: { 'application/json': { schema: RoleSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'put',
  path: '/api/v1/roles/{roleId}',
  tags: ['Roles'],
  summary: 'Update a role',
  security,
  request: {
    params: RoleParamsSchema,
    body: {
      content: { 'application/json': { schema: UpdateRoleBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Role updated',
      content: { 'application/json': { schema: RoleSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/roles/{organizationId}',
  tags: ['Roles'],
  summary: 'List roles in an organization',
  security,
  request: { params: RoleOrgParamsSchema },
  responses: {
    200: {
      description: 'List of roles',
      content: {
        'application/json': { schema: z.array(RoleSchema) },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/roles/{organizationId}/subordinate',
  tags: ['Roles'],
  summary: 'List subordinate roles for the current user',
  security,
  request: { params: RoleOrgParamsSchema },
  responses: {
    200: {
      description: 'List of subordinate roles',
      content: {
        'application/json': { schema: z.array(RoleSchema) },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/roles/{roleId}/permissions',
  tags: ['Roles'],
  summary: 'Remove permissions from a role',
  security,
  request: {
    params: RoleParamsSchema,
    body: {
      content: {
        'application/json': { schema: RemovePermissionsBodySchema },
      },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Permissions removed',
      content: {
        'application/json': {
          schema: z.object({ success: z.literal(true) }),
        },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/roles/{roleId}',
  tags: ['Roles'],
  summary: 'Delete a role',
  security,
  request: { params: RoleParamsSchema },
  responses: {
    200: {
      description: 'Role deleted',
      content: {
        'application/json': {
          schema: z.object({ success: z.literal(true) }),
        },
      },
    },
    ...errors,
  },
});

// Datasources
registry.registerPath({
  method: 'post',
  path: '/api/v1/datasources/{organizationId}/test',
  tags: ['Datasources'],
  summary: 'Test a database connection',
  security,
  request: {
    params: DatasourceOrgParamsSchema,
    body: {
      content: { 'application/json': { schema: TestConnectionBodySchema } },
      required: true,
    },
  },
  responses: {
    200: {
      description: 'Connection test result',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().openapi({ example: true }),
          }),
        },
      },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'post',
  path: '/api/v1/datasources/{organizationId}',
  tags: ['Datasources'],
  summary: 'Create a new datasource',
  security,
  request: {
    params: DatasourceOrgParamsSchema,
    body: {
      content: {
        'application/json': { schema: CreateDatasourceBodySchema },
      },
      required: true,
    },
  },
  responses: {
    201: {
      description: 'Datasource created',
      content: { 'application/json': { schema: DatasourceSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'get',
  path: '/api/v1/datasources/{organizationId}',
  tags: ['Datasources'],
  summary: 'List datasources for an organization',
  security,
  request: {
    params: DatasourceOrgParamsSchema,
    query: ListDatasourcesQuerySchema,
  },
  responses: {
    200: {
      description: 'Paginated list of datasources',
      content: { 'application/json': { schema: DatasourcePageSchema } },
    },
    ...errors,
  },
});

registry.registerPath({
  method: 'delete',
  path: '/api/v1/datasources/{organizationId}/{datasourceId}',
  tags: ['Datasources'],
  summary: 'Delete a datasource',
  security,
  request: { params: DatasourceParamsSchema },
  responses: {
    200: {
      description: 'Datasource deleted',
      content: {
        'application/json': {
          schema: z.object({ success: z.literal(true) }),
        },
      },
    },
    ...errors,
  },
});

export function generateOpenAPIDocument(): object {
  const generator = new OpenApiGeneratorV31(registry.definitions);
  return generator.generateDocument({
    openapi: '3.1.0',
    info: {
      version: '1.0.0',
      title: 'InsightAI API',
      description: 'Backend API for the InsightAI platform',
    },
    servers: [{ url: '/' }],
  });
}
