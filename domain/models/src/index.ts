export * from './Datasource';
export * from './Organization';
export * from './Report';
export * from './Role';
export * from './User';
export * from './error';
export * from './Engine';

export interface Page<T> {
  items: T[];
  total: number;
  hasNext: boolean;
  totalPages: number;
}

export const SESSION_EXPIRATION = 3600 * 24;
