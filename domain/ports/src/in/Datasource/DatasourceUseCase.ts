import { Datasource, DatasourceType, Page } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface CreateDatasourceInput {
  name: string;
  type: DatasourceType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
}

export interface TestConnectionInput {
  type: DatasourceType;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
  connectionString?: string;
}

export interface DatasourceUseCase {
  createDatasource(
    organizationId: UUID,
    userId: UUID,
    data: CreateDatasourceInput,
  ): Promise<Datasource>;
  listDatasources(
    organizationId: UUID,
    userId: UUID,
    page?: number,
  ): Promise<Page<Datasource>>;
  deleteDatasource(datasourceId: UUID, userId: UUID): Promise<void>;
  testConnection(
    organizationId: UUID,
    userId: UUID,
    data: TestConnectionInput,
  ): Promise<boolean>;
}
