import { UUID } from 'node:crypto';

export interface Report {
  idReport: UUID;
  datasourceId: UUID;
  createdByUserId: UUID;
  name: string;
  description?: string;
  dataUrl: string;
  createdAt: Date;
  updatedAt: Date;
}
