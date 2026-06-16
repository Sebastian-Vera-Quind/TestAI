import { DataError, DatasourceType } from '@insight-ai/domain-models';
import {
  CreateDatasourceInput,
  TestConnectionInput,
} from '@insight-ai/domain-ports/in';
import { URL } from 'node:url';

const DATASOURCE_TYPES = new Set<string>(Object.values(DatasourceType));

const DEFAULT_PORTS: Record<string, number> = {
  POSTGRESQL: 5432,
  MYSQL: 3306,
  SQLSERVER: 1433,
  ORACLE: 1521,
};

const PROTOCOL_TO_TYPE: Record<string, DatasourceType> = {
  postgresql: DatasourceType.POSTGRESQL,
  postgres: DatasourceType.POSTGRESQL,
  mysql: DatasourceType.MYSQL,
  sqlserver: DatasourceType.SQLSERVER,
  mssql: DatasourceType.SQLSERVER,
  oracle: DatasourceType.ORACLE,
};

function parseConnectionString(
  connectionString: string,
  fallbackType?: DatasourceType,
): {
  type: DatasourceType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new DataError('Invalid connection string format.');
  }

  const protocol = url.protocol.replace(':', '').toLowerCase();
  const type = PROTOCOL_TO_TYPE[protocol] ?? fallbackType;
  if (!type) {
    throw new DataError(`Unsupported database protocol: ${protocol}`);
  }

  const host = url.hostname;
  const port = url.port ? parseInt(url.port, 10) : DEFAULT_PORTS[type];
  const username = decodeURIComponent(url.username);
  const password = decodeURIComponent(url.password);
  const database = url.pathname.replace(/^\//, '');

  if (!host) throw new DataError('Connection string missing host.');
  if (!database)
    throw new DataError('Connection string missing database name.');

  return { type, host, port, username, password, database };
}

export function resolveConnectionConfig(
  data: TestConnectionInput | CreateDatasourceInput,
): {
  type: DatasourceType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
} {
  if (!data.connectionString && !data.type) {
    throw new DataError(
      'type must be one of: POSTGRESQL, MYSQL, SQLSERVER, ORACLE.',
    );
  }

  if (data.connectionString) {
    return parseConnectionString(data.connectionString, data.type);
  }

  if (!data.host) throw new DataError('host is required.');
  if (!data.port) throw new DataError('port is required.');
  if (!data.database) throw new DataError('database is required.');
  if (!data.username) throw new DataError('username is required.');
  if (!data.password) throw new DataError('password is required.');
  if (!data.type || !DATASOURCE_TYPES.has(data.type as string)) {
    throw new DataError('Invalid datasource type.');
  }

  return {
    type: data.type,
    host: data.host,
    port: data.port,
    username: data.username,
    password: data.password,
    database: data.database,
  };
}
