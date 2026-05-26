import {
  DbTopology,
  TableSchema,
  QueryResult,
} from '@insight-ai/domain-models';
import { DatasourceConnector } from '@insight-ai/domain-ports/out';
import * as oracledb from 'oracledb';

interface OracleTableRow {
  table_name: string;
}

interface OracleForeignKeyRow {
  table_name: string;
  foreign_table: string;
}

interface OracleColumnRow {
  column_name: string;
  data_type: string;
  nullable: string;
}

interface OracleColumnFkRow {
  column_name: string;
  foreign_table: string;
  foreign_column: string;
}

type OracleConnection = oracledb.Connection;

export class OracleStrategy implements DatasourceConnector {
  private connection: OracleConnection | null = null;
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
      await this.connection.close();
      this.connection = null;
    }
  }

  async getTopology(): Promise<DbTopology[]> {
    await this.check();

    const tablesRes = await this.connection!.execute<OracleTableRow>(
      `SELECT table_name
       FROM user_tables
       ORDER BY table_name`,
    );

    const fkRes = await this.connection!.execute<OracleForeignKeyRow>(
      `SELECT
         uc.table_name AS table_name,
         ucc.table_name AS foreign_table
       FROM user_constraints uc
       INNER JOIN user_cons_columns ucc
         ON uc.constraint_name = ucc.constraint_name
       LEFT JOIN user_constraints ucc2
         ON ucc.constraint_name = ucc2.r_constraint_name
       INNER JOIN user_constraints ucc3
         ON ucc2.constraint_name = ucc3.constraint_name
       WHERE uc.constraint_type = 'R'
       GROUP BY uc.table_name, ucc.table_name`,
    );

    const tables: string[] = (tablesRes.rows || []).map((r) => r.table_name);
    const map = new Map<string, Set<string>>();
    for (const t of tables) map.set(t, new Set<string>());

    for (const row of fkRes.rows || []) {
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

    const colRes = await this.connection!.execute<OracleColumnRow>(
      `SELECT
         atc.column_name,
         atc.data_type,
         atc.nullable
       FROM all_tab_columns atc
       WHERE atc.owner = SYS_CONTEXT('USERENV', 'CURRENT_USER') AND atc.table_name = UPPER(:tableName)
       ORDER BY atc.column_id`,
      { tableName: tableName.toUpperCase() },
    );

    const fkRes = await this.connection!.execute<OracleColumnFkRow>(
      `SELECT
         ucc.column_name,
         ucc2.table_name AS foreign_table,
         ucc2.column_name AS foreign_column
       FROM user_cons_columns ucc
       INNER JOIN user_constraints uc
         ON ucc.constraint_name = uc.constraint_name
       INNER JOIN user_constraints uc2
         ON uc.r_constraint_name = uc2.constraint_name
       INNER JOIN user_cons_columns ucc2
         ON uc2.constraint_name = ucc2.constraint_name
       WHERE uc.constraint_type = 'R' AND uc.table_name = UPPER(:tableName)`,
      { tableName: tableName.toUpperCase() },
    );

    const fkMap = new Map<string, { tableName: string; columnName: string }>();
    for (const row of fkRes.rows || []) {
      fkMap.set(row.column_name, {
        tableName: row.foreign_table,
        columnName: row.foreign_column,
      });
    }

    const columns = (colRes.rows || []).map((r) => {
      const colName = r.column_name;
      const fk = fkMap.get(colName);
      return {
        name: colName,
        type: r.data_type,
        isNullable: r.nullable.toUpperCase() === 'Y',
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
    const res = await this.connection!.execute<T>(query);

    const columns: string[] = (res.metaData || []).map((m) => m.name);
    const rows: T[] = res.rows || [];

    return { columns, rows };
  }

  private async check(): Promise<void> {
    if (this.connection) {
      return;
    }
    if (!this.opts) {
      throw new Error('Oracle connection options are not initialized');
    }

    this.connection = await oracledb.getConnection({
      user: this.opts.user,
      password: this.opts.password,
      connectionString: `${this.opts.host}:${this.opts.port}/${this.opts.database}`,
    });
  }
}
