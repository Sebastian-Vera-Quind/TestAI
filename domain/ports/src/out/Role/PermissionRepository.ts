import { UUID } from 'node:crypto';
import {
  Permission,
  PermissionCode,
  Resource,
} from '@insight-ai/domain-models';

export interface PermissionRepository {
  getMemberPermissions(
    memberId: UUID,
    organizationId: UUID,
  ): Promise<Permission[]>;

  getRolePermissions(roleId: UUID): Promise<Permission[]>;
  getRolePermission(roleId: UUID): Promise<Permission[]>;
  getUserPermissionsByResource(
    userId: UUID,
    organizationId: UUID,
    resource: UUID,
    resourceType: Resource,
  ): Promise<Permission[]>;
  findPermission(
    roleId: UUID,
    code: PermissionCode,
    datasourceId?: UUID,
    reportId?: UUID,
  ): Promise<Permission | null>;

  hasRolePermission(
    roleId: UUID,
    code: PermissionCode,
    resourceId?: UUID,
    resourceType?: Resource,
  ): Promise<boolean>;

  hasPermission(
    userId: UUID,
    organizationId: UUID,
    code: PermissionCode,
    resource?: UUID,
    resourceType?: Resource,
  ): Promise<boolean>;

  createPermission(
    permission: Omit<Permission, 'permissionId'>,
  ): Promise<Permission>;

  deletePermission(permissionId: UUID): Promise<void>;

  listPermissionsByRole(roleId: UUID): Promise<Permission[]>;

  getAccessibleDatasourceIds(
    userId: UUID,
    organizationId: UUID,
  ): Promise<UUID[]>;
}
