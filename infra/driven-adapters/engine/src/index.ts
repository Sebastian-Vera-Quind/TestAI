import { DatasourceType } from '@insight-ai/domain-models';
import {
  DatasourceConnector,
  DatasourceConnectorFactory,
} from '@insight-ai/domain-ports/out';
import {
  MssqlStrategy,
  MysqlStrategy,
  OracleStrategy,
  PostgresStrategy,
} from './strategy';

export class DatabaseFactoryAdapter implements DatasourceConnectorFactory {
  createConnection(
    type: DatasourceType,
    config: {
      host: string;
      port: number;
      user: string;
      database: string;
      password: string;
    },
  ): DatasourceConnector {
    switch (type) {
      case DatasourceType.POSTGRESQL:
        return new PostgresStrategy(config);
      case DatasourceType.MYSQL:
        return new MysqlStrategy(config);
      case DatasourceType.ORACLE:
        return new OracleStrategy(config);
      case DatasourceType.SQLSERVER:
        return new MssqlStrategy(config);
    }
  }
}
