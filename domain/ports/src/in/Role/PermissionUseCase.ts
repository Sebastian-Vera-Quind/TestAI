import { PermissionCode } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface PermissionUseCase {
  /**
   * Check if a specific role has a given permission, optionally scoped to a resource.
   *
   * For `ds` codes pass the datasourceId as resourceId.
   * For `inf` codes pass the reportId as resourceId.
   * For `org` and `role` codes resourceId is not needed.
   */
  hasRolePermission(
    roleId: UUID,
    organizationId: UUID,
    code: PermissionCode,
    resourceId?: UUID,
  ): Promise<boolean>;

  /**
   * Check if a user has a given permission within an organization, optionally scoped to a resource.
   *
   * For `ds` codes pass the datasourceId as resourceId.
   * For `inf` codes pass the reportId as resourceId.
   * For `org` and `role` codes resourceId is not needed.
   */
  hasUserPermission(
    userId: UUID,
    organizationId: UUID,
    code: PermissionCode,
    resourceId?: UUID,
  ): Promise<boolean>;
}
