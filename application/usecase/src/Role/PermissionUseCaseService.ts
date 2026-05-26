import {
  ForbiddenError,
  NotFoundError,
  PermissionCode,
  Resource,
} from '@insight-ai/domain-models';
import { type PermissionUseCase } from '@insight-ai/domain-ports/in';
import {
  type OrganizationRepository,
  type PermissionRepository,
  type RoleRepository,
} from '@insight-ai/domain-ports/out';
import { type UUID } from 'node:crypto';

export interface PermissionUseCaseServiceDependencies {
  roleRepository: RoleRepository;
  permissionRepository: PermissionRepository;
  organizationRepository: OrganizationRepository;
}

function inferResourceType(code: PermissionCode): Resource | undefined {
  const prefix = code.split(':')[0];
  const values = Object.values(Resource) as string[];
  if (values.includes(prefix)) return prefix as Resource;
  return undefined;
}

export class PermissionUseCaseService implements PermissionUseCase {
  constructor(private readonly deps: PermissionUseCaseServiceDependencies) {}

  async hasRolePermission(
    roleId: UUID,
    organizationId: UUID,
    code: PermissionCode,
    resourceId?: UUID,
  ): Promise<boolean> {
    const role = await this.deps.roleRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);
    if (role.organizationId !== organizationId) {
      throw new ForbiddenError('Role does not belong to this organization.');
    }

    const resourceType = inferResourceType(code);
    return this.deps.permissionRepository.hasRolePermission(
      roleId,
      code,
      resourceId,
      resourceType,
    );
  }

  async hasUserPermission(
    userId: UUID,
    organizationId: UUID,
    code: PermissionCode,
    resourceId?: UUID,
  ): Promise<boolean> {
    const member = await this.deps.organizationRepository.getMember(
      userId,
      organizationId,
    );
    if (!member) throw new NotFoundError('Organization', organizationId);

    const resourceType = inferResourceType(code);
    return this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      code,
      resourceId,
      resourceType,
    );
  }
}
