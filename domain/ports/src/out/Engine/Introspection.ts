import {
  DatasourceType,
  DbTopology,
  QueryResult,
  TableSchema,
} from '@insight-ai/domain-models';

export interface DatasourceConnectorFactory {
  createConnection(
    type: DatasourceType,
    config: {
      host: string;
      port: number;
      user: string;
      database: string;
      password: string;
    },
  ): DatasourceConnector;
}

export interface DatasourceConnector {
  close(): Promise<void>;
  getTopology(): Promise<DbTopology[]>;
  getTableSchema(tableName: string): Promise<TableSchema>;
  executeQuery<T>(query: string): Promise<QueryResult<T>>;
}
