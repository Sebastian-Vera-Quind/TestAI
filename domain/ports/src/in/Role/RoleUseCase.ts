import { Role } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface CreateRoleInput {
  name: string;
  parentRoleId: UUID;
  color?: string;
  permissions?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  parentRoleId?: string;
  color?: string;
  permissions?: string[];
}

export interface RoleUseCase {
  createRole(
    organizationId: UUID,
    userId: UUID,
    data: CreateRoleInput,
  ): Promise<Role>;
  updateRole(roleId: UUID, userId: UUID, data: UpdateRoleInput): Promise<Role>;
  listRoles(organizationId: UUID, userId: UUID): Promise<Role[]>;
  listSubordinateRoles(organizationId: UUID, userId: UUID): Promise<Role[]>;
  deleteRole(roleId: UUID, userId: UUID): Promise<void>;
  removePermissions(
    roleId: UUID,
    userId: UUID,
    permissions: string[],
  ): Promise<void>;
}
