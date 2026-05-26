import { UUID } from 'node:crypto';

export interface Member {
  idMember: UUID;
  organizationId: UUID;
  isFavorite: boolean;
  userId: UUID;
  createdAt: Date;
  updatedAt: Date;
}
