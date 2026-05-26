import { UUID } from 'node:crypto';

export enum DatasourceType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  SQLSERVER = 'SQLSERVER',
  ORACLE = 'ORACLE',
}

export interface Datasource {
  idDatasource: UUID;
  organizationId: UUID;
  createdByUserId: UUID;
  name: string;
  type: DatasourceType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
  createdAt: Date;
  updatedAt: Date;
}
