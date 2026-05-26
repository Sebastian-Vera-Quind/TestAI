import {
  DbTopology,
  TableSchema,
  QueryResult,
} from '@insight-ai/domain-models';
import { DatasourceConnector } from '@insight-ai/domain-ports/out';
import { Client, QueryResultRow } from 'pg';

export class PostgresStrategy implements DatasourceConnector {
  private readonly client: Client;
  private isConnected = false;

  constructor(opts: {
    host: string;
    port: number;
    user: string;
    database: string;
    password: string;
  }) {
    this.client = new Client({
      host: opts.host,
      port: opts.port,
      user: opts.user,
      database: opts.database,
      password: opts.password,
    });
  }

  async close(): Promise<void> {
    await this.client.end();
    this.isConnected = false;
  }

  async getTopology(): Promise<DbTopology[]> {
    await this.check();

    const tablesRes = await this.client.query<{ table_name: string }>(
      `SELECT table_name
       FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );

    const fkRes = await this.client.query<{
      table_name: string;
      foreign_table: string;
    }>(
      `SELECT tc.table_name AS table_name, ccu.table_name AS foreign_table
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'`,
    );

    const tables: string[] = tablesRes.rows.map((r) => r.table_name);
    const map = new Map<string, Set<string>>();
    for (const t of tables) map.set(t, new Set<string>());

    for (const row of fkRes.rows) {
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

    const colRes = await this.client.query<{
      column_name: string;
      data_type: string;
      is_nullable: string;
    }>(
      `SELECT column_name, data_type, is_nullable
       FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = $1
       ORDER BY ordinal_position`,
      [tableName],
    );

    const fkRes = await this.client.query<{
      column_name: string;
      foreign_table: string;
      foreign_column: string;
    }>(
      `SELECT kcu.column_name AS column_name, ccu.table_name AS foreign_table, ccu.column_name AS foreign_column
       FROM information_schema.table_constraints AS tc
       JOIN information_schema.key_column_usage AS kcu
         ON tc.constraint_name = kcu.constraint_name AND tc.constraint_schema = kcu.constraint_schema
       JOIN information_schema.constraint_column_usage AS ccu
         ON ccu.constraint_name = tc.constraint_name AND ccu.constraint_schema = tc.constraint_schema
       WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public' AND tc.table_name = $1`,
      [tableName],
    );

    const fkMap = new Map<string, { tableName: string; columnName: string }>();
    for (const row of fkRes.rows) {
      fkMap.set(row.column_name, {
        tableName: row.foreign_table,
        columnName: row.foreign_column,
      });
    }

    const columns = colRes.rows.map((r) => {
      const colName = r.column_name;
      const fk = fkMap.get(colName);
      return {
        name: colName,
        type: r.data_type,
        isNullable: r.is_nullable.toUpperCase() === 'YES',
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
    const res = await this.client.query<T & QueryResultRow>(query);

    const columns = res.fields.map((f) => f.name);
    const rows = res.rows;

    return { columns, rows };
  }

  private async check() {
    if (this.isConnected) {
      return;
    }
    if (!this.client) {
      throw new Error('Postgres client is not initialized');
    }

    await this.client.connect();
    this.isConnected = true;
  }
}
