import { z, registry } from './registry';
import { UUIDSchema, pageOf } from './common';

export const DatasourceOrgParamsSchema = z.object({
  organizationId: UUIDSchema,
});

export const DatasourceParamsSchema = z.object({
  organizationId: UUIDSchema,
  datasourceId: UUIDSchema,
});

export const DatasourceTypeEnum = z.enum([
  'POSTGRESQL',
  'MYSQL',
  'SQLSERVER',
  'ORACLE',
]);

const connectionBase = {
  type: DatasourceTypeEnum.optional().openapi({
    description: 'Database engine type',
    example: 'POSTGRESQL',
  }),
  host: z.string().optional().openapi({ example: 'localhost' }),
  port: z.number().int().optional().openapi({ example: 5432 }),
  database: z.string().optional().openapi({ example: 'mydb' }),
  username: z.string().optional().openapi({ example: 'admin' }),
  password: z.string().optional().openapi({ example: 'secret' }),
  connectionString: z.string().optional().openapi({
    description: 'Full connection string (overrides individual fields)',
    example: 'postgresql://admin:secret@localhost:5432/mydb',
  }),
};

export const TestConnectionBodySchema = z.object(connectionBase);

export const CreateDatasourceBodySchema = z.object({
  name: z.string().min(1).openapi({ example: 'Production DB' }),
  ...connectionBase,
});

export const ListDatasourcesQuerySchema = z.object({
  page: z.coerce
    .number()
    .int()
    .positive()
    .optional()
    .default(1)
    .openapi({ example: 1 }),
});

export const DatasourceSchema = registry.register(
  'Datasource',
  z.object({
    idDatasource: UUIDSchema,
    name: z.string().openapi({ example: 'Production DB' }),
    type: DatasourceTypeEnum.optional().openapi({ example: 'POSTGRESQL' }),
    host: z.string().nullable().optional().openapi({ example: 'localhost' }),
    port: z.number().nullable().optional().openapi({ example: 5432 }),
    database: z.string().nullable().optional().openapi({ example: 'mydb' }),
    username: z.string().nullable().optional().openapi({ example: 'admin' }),
    createdAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
    updatedAt: z.iso
      .datetime()
      .openapi({ example: '2024-01-01T00:00:00.000Z' }),
  }),
);

export const DatasourcePageSchema = registry.register(
  'DatasourcePage',
  pageOf(DatasourceSchema),
);
