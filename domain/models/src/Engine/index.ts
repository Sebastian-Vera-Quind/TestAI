export interface QueryResult<T> {
  columns: string[];
  rows: T[];
}

export interface DbTopology {
  name: string;
  connectedTo: string[];
}

export interface TableSchema {
  columns: ColumnSchema[];
}

export interface ColumnSchema {
  name: string;
  type: string;
  isNullable: boolean;
  foreignKey?: {
    tableName: string;
    columnName: string;
  };
}
