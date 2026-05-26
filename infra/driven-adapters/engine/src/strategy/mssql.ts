import {
  DbTopology,
  TableSchema,
  QueryResult,
} from '@insight-ai/domain-models';
import { DatasourceConnector } from '@insight-ai/domain-ports/out';
import { ConnectionPool } from 'mssql';

interface MssqlTableRow {
  TABLE_NAME: string;
}

interface MssqlForeignKeyRow {
  table_name: string;
  foreign_table: string;
}

interface MssqlColumnRow {
  COLUMN_NAME: string;
  DATA_TYPE: string;
  IS_NULLABLE: string;
}

interface MssqlColumnFkRow {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}

export class MssqlStrategy implements DatasourceConnector {
  private readonly pool: ConnectionPool;
  private isConnected = false;

  constructor(opts: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    this.pool = new ConnectionPool({
      server: opts.host,
      port: opts.port,
      user: opts.user,
      password: opts.password,
      database: opts.database,
      options: {
        trustServerCertificate: true,
      },
    });
  }

  async close(): Promise<void> {
    await this.pool.close();
    this.isConnected = false;
  }

  async getTopology(): Promise<DbTopology[]> {
    await this.check();

    const tablesRes = await this.pool.request().query<MssqlTableRow>(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = 'dbo' AND TABLE_TYPE = 'BASE TABLE'`,
    );

    const fkRes = await this.pool.request().query<MssqlForeignKeyRow>(
      `SELECT
         tc.TABLE_NAME AS table_name,
         ucc.TABLE_NAME AS foreign_table
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
       INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
         ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
       INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ucc
         ON ucc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND ucc.TABLE_SCHEMA = tc.TABLE_SCHEMA
       WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY' AND tc.TABLE_SCHEMA = 'dbo'`,
    );

    const tables: string[] = tablesRes.recordset.map((r) => r.TABLE_NAME);
    const map = new Map<string, Set<string>>();
    for (const t of tables) map.set(t, new Set<string>());

    for (const row of fkRes.recordset) {
      const table = row.table_name;
      const foreignTable = row.foreign_table;
      if (!map.has(table)) map.set(table, new Set<string>());
      map.get(table)!.add(foreignTable);
    }

    const result: DbTopology[] = [];
    for (const [name, set] of map.entries()) {
      result.push({ name, connectedTo: Array.from(set) });
    }

    return result;
  }

  async getTableSchema(tableName: string): Promise<TableSchema> {
    await this.check();

    const colRes = await this.pool
      .request()
      .input('tableName', tableName)
      .query<MssqlColumnRow>(
        `SELECT
         COLUMN_NAME,
         DATA_TYPE,
         IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = 'dbo' AND TABLE_NAME = @tableName
       ORDER BY ORDINAL_POSITION`,
      );

    const fkRes = await this.pool
      .request()
      .input('tableName', tableName)
      .query<MssqlColumnFkRow>(
        `SELECT
         kcu.COLUMN_NAME AS column_name,
         ucc.TABLE_NAME AS foreign_table,
         ucc.COLUMN_NAME AS foreign_column
       FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS AS tc
       INNER JOIN INFORMATION_SCHEMA.KEY_COLUMN_USAGE AS kcu
         ON tc.CONSTRAINT_NAME = kcu.CONSTRAINT_NAME AND tc.TABLE_SCHEMA = kcu.TABLE_SCHEMA
       INNER JOIN INFORMATION_SCHEMA.CONSTRAINT_COLUMN_USAGE AS ucc
         ON ucc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME AND ucc.TABLE_SCHEMA = tc.TABLE_SCHEMA
       WHERE tc.CONSTRAINT_TYPE = 'FOREIGN KEY' AND tc.TABLE_SCHEMA = 'dbo' AND tc.TABLE_NAME = @tableName`,
      );

    const fkMap = new Map<string, { tableName: string; columnName: string }>();
    for (const row of fkRes.recordset) {
      fkMap.set(row.column_name, {
        tableName: row.foreign_table,
        columnName: row.foreign_column,
      });
    }

    const columns = colRes.recordset.map((r) => {
      const colName = r.COLUMN_NAME;
      const fk = fkMap.get(colName);
      return {
        name: colName,
        type: r.DATA_TYPE,
        isNullable: r.IS_NULLABLE.toUpperCase() === 'YES',
        foreignKey: fk
          ? { tableName: fk.tableName, columnName: fk.columnName }
          : undefined,
      };
    });

    return { columns };
  }

  async executeQuery<T>(query: string): Promise<QueryResult<T>> {
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    const lowered = query.trim().toLowerCase();
    const allowedStart =
      lowered.startsWith('select') || lowered.startsWith('with');
    const forbidden =
      /\b(insert|update|delete|drop|truncate|alter|create|grant|revoke|replace|merge|set|copy)\b/i;
    if (!allowedStart || forbidden.test(query)) {
      throw new Error('Only read-only SELECT queries are allowed');
    }

    if (query.includes(';')) {
      throw new Error(
        'Multiple statements or statement terminators are not allowed',
      );
    }

    await this.check();
    const res = await this.pool.request().query<T>(query);

    const columns: string[] =
      res.recordset.length > 0 ? Object.keys(res.recordset[0] ?? {}) : [];
    const rows: T[] = res.recordset;

    return { columns, rows };
  }

  private async check(): Promise<void> {
    if (this.isConnected) {
      return;
    }
    if (!this.pool) {
      throw new Error('MSSQL pool is not initialized');
    }

    await this.pool.connect();
    this.isConnected = true;
  }
}
