import {
  DbTopology,
  TableSchema,
  QueryResult,
} from '@insight-ai/domain-models';
import { DatasourceConnector } from '@insight-ai/domain-ports/out';
import { createConnection, Connection, RowDataPacket } from 'mysql2/promise';

interface MysqlTableRow extends RowDataPacket {
  TABLE_NAME: string;
}

interface MysqlForeignKeyRow extends RowDataPacket {
  table_name: string;
  foreign_table: string;
}

interface MysqlColumnRow extends RowDataPacket {
  COLUMN_NAME: string;
  COLUMN_TYPE: string;
  IS_NULLABLE: string;
}

interface MysqlColumnFkRow extends RowDataPacket {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}

export class MysqlStrategy implements DatasourceConnector {
  private connection: Connection | null = null;
  private readonly opts: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  };

  constructor(opts: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
  }) {
    this.opts = opts;
  }

  async close(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async getTopology(): Promise<DbTopology[]> {
    await this.check();

    const [tablesRes] = await this.connection!.query<MysqlTableRow[]>(
      `SELECT TABLE_NAME
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = ? AND TABLE_TYPE = 'BASE TABLE'`,
      [this.opts.database],
    );

    const [fkRes] = await this.connection!.query<MysqlForeignKeyRow[]>(
      `SELECT
         rc.TABLE_NAME AS table_name,
         rc.REFERENCED_TABLE_NAME AS foreign_table
       FROM INFORMATION_SCHEMA.REFERENTIAL_CONSTRAINTS rc
       WHERE rc.CONSTRAINT_SCHEMA = ?
       GROUP BY rc.TABLE_NAME, rc.REFERENCED_TABLE_NAME`,
      [this.opts.database],
    );

    const tables: string[] = tablesRes.map((r) => r.TABLE_NAME);
    const map = new Map<string, Set<string>>();
    for (const t of tables) map.set(t, new Set<string>());

    for (const row of fkRes) {
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

    const [colRes] = await this.connection!.query<MysqlColumnRow[]>(
      `SELECT
         COLUMN_NAME,
         COLUMN_TYPE,
         IS_NULLABLE
       FROM INFORMATION_SCHEMA.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?
       ORDER BY ORDINAL_POSITION`,
      [this.opts.database, tableName],
    );

    const [fkRes] = await this.connection!.query<MysqlColumnFkRow[]>(
      `SELECT
         kcu.COLUMN_NAME AS column_name,
         kcu.REFERENCED_TABLE_NAME AS foreign_table,
         kcu.REFERENCED_COLUMN_NAME AS foreign_column
       FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE kcu
       WHERE kcu.TABLE_SCHEMA = ? AND kcu.TABLE_NAME = ? AND kcu.REFERENCED_TABLE_NAME IS NOT NULL`,
      [this.opts.database, tableName],
    );

    const fkMap = new Map<string, { tableName: string; columnName: string }>();
    for (const row of fkRes) {
      fkMap.set(row.column_name, {
        tableName: row.foreign_table,
        columnName: row.foreign_column,
      });
    }

    const columns = colRes.map((r) => {
      const colName = r.COLUMN_NAME;
      const fk = fkMap.get(colName);
      return {
        name: colName,
        type: r.COLUMN_TYPE,
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
    const [rows] = await this.connection!.query<(T & RowDataPacket)[]>(query);

    const columns: string[] = rows.length > 0 ? Object.keys(rows[0]) : [];

    return { columns, rows };
  }

  private async check(): Promise<void> {
    if (this.connection) {
      return;
    }
    if (!this.opts) {
      throw new Error('MySQL connection options are not initialized');
    }

    this.connection = await createConnection({
      host: this.opts.host,
      port: this.opts.port,
      user: this.opts.user,
      password: this.opts.password,
      database: this.opts.database,
    });
  }
}
