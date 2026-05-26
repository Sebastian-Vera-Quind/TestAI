import { UUID } from 'node:crypto';

export interface Organization {
  organizationId: UUID;
  name: string;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}
