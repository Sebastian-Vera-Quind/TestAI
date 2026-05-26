import { UUID } from 'node:crypto';

export interface Role {
  idRole: UUID;
  organizationId: UUID;
  parentRoleId?: UUID;
  name: string;
  color: string;
  updatedBy: UUID;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoleMember {
  memberId: UUID;
  roleId: UUID;
  assignedAt: Date;
  assignedByUserId?: UUID;
}
