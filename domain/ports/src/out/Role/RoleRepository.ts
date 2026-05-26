import { Page, Role, RoleMember } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export type RoleUpdateData = {
  name?: string;
  color?: string;
  parentRoleId?: UUID | null;
  updatedBy?: UUID;
};

export interface RoleRepository {
  createRole(
    role: Omit<Role, 'idRole' | 'createdAt' | 'updatedAt'>,
  ): Promise<Role>;
  updateRole(roleId: UUID, data: RoleUpdateData): Promise<Role>;
  deleteRole(roleId: UUID): Promise<void>;
  findRoleById(roleId: UUID): Promise<Role | null>;
  getChildRole(parentRoleId: UUID, organizationId: UUID): Promise<Role | null>;
  getRoleLevel(roleId: UUID, organizationId: UUID): Promise<number>;
  getMembersCountInRole(roleId: UUID): Promise<number>;
  listRolesByOrganizationHierarchy(organizationId: UUID): Promise<Role[]>;
  getUserRoles(userId: UUID, organizationId: UUID): Promise<Role[]>;

  getMemberRoles(memberId: UUID, organizationId: UUID): Promise<Role[]>;
  listRolesByOrganization(
    organizationId: UUID,
    page?: number,
  ): Promise<Page<Role>>;
  listMemberRoles(
    memberId: UUID,
    organizationId: UUID,
    page?: number,
  ): Promise<Page<Role>>;
  addMemberToRole(
    memberId: UUID,
    roleId: UUID,
    assignedByUserId?: UUID,
  ): Promise<RoleMember>;
  removeMemberFromRole(memberId: UUID, roleId: UUID): Promise<void>;
}
