import { z, registry } from '../../schemas/registry';
import { UUIDSchema, pageOf } from '../../schemas/common';

export const DatasourceParams = z.object({
  organizationId: UUIDSchema,
  datasourceId: UUIDSchema,
});

const VALID_DB_TYPES = ['POSTGRESQL', 'MYSQL', 'SQLSERVER', 'ORACLE'] as const;

export const TestConnectionBody = z.object({
  type: z.enum(VALID_DB_TYPES).optional().openapi({ example: 'POSTGRESQL' }),
  host: z.string().optional(),
  port: z.number().int().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  connectionString: z.string().optional(),
});

export const CreateDatasourceBody = z.object({
  name: z.string().min(1).openapi({ example: 'Primary DB' }),
  type: z.enum(VALID_DB_TYPES).optional().openapi({ example: 'POSTGRESQL' }),
  host: z.string().optional(),
  port: z.number().int().optional(),
  database: z.string().optional(),
  username: z.string().optional(),
  password: z.string().optional(),
  connectionString: z.string().optional(),
});

export const ListDatasourcesQuery = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({ example: 1 }),
});

export const Datasource = registry.register(
  'Datasource',
  z.object({
    idDatasource: UUIDSchema,
    name: z.string().openapi({ example: 'Primary DB' }),
    type: z.string().openapi({ example: 'POSTGRESQL' }),
    createdAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
    updatedAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
  }),
);

export const DatasourcePage = registry.register(
  'DatasourcePage',
  pageOf(Datasource),
);
