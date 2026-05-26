import {
  ACTION,
  ForbiddenError,
  DataError,
  NotFoundError,
  PermissionCode,
  Resource,
  TOPLEVEL_ACTION,
  type Role,
} from '@insight-ai/domain-models';
import {
  type CreateRoleInput,
  type RoleUseCase,
  type UpdateRoleInput,
} from '@insight-ai/domain-ports/in';
import {
  type DatasourceRepository,
  type OrganizationRepository,
  type PermissionRepository,
  type RoleRepository,
} from '@insight-ai/domain-ports/out';
import { type UUID } from 'node:crypto';
import { generateVividRandomColorHex } from '../util';

const HEX_COLOR_RE = /^#[0-9A-Fa-f]{6}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isValidHexColor(color: string): boolean {
  return HEX_COLOR_RE.test(color);
}

function isValidUUID(value: string): value is UUID {
  return UUID_RE.test(value);
}

const VALID_RESOURCES = new Set<string>(Object.values(Resource));
const VALID_ACTIONS = new Set<string>([
  ...Object.values(ACTION),
  ...Object.values(TOPLEVEL_ACTION),
]);

export interface RoleUseCaseServiceDependencies {
  roleRepository: RoleRepository;
  permissionRepository: PermissionRepository;
  organizationRepository: OrganizationRepository;
  datasourceRepository: DatasourceRepository;
}

export class RoleUseCaseService implements RoleUseCase {
  constructor(private readonly deps: RoleUseCaseServiceDependencies) {}

  async createRole(
    organizationId: UUID,
    userId: UUID,
    data: CreateRoleInput,
  ): Promise<Role> {
    await this.requireMembership(userId, organizationId);

    const canCreate = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'role:create',
    );
    const isAdmin = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'org:admin',
    );
    if (!canCreate && !isAdmin) {
      throw new ForbiddenError('Insufficient permissions to create roles.');
    }

    const name = data.name.trim();
    if (!name) throw new DataError('Role name cannot be empty.');
    if (name.length > 50)
      throw new DataError('Role name cannot exceed 50 characters.');

    const color = data.color ?? generateVividRandomColorHex();
    if (data.color && !isValidHexColor(data.color)) {
      throw new DataError(
        'Color must be a valid hexadecimal color (e.g. #A1B2C3).',
      );
    }

    const parentRole = await this.deps.roleRepository.findRoleById(
      data.parentRoleId,
    );
    if (!parentRole) throw new NotFoundError('Role', data.parentRoleId);
    if (parentRole.organizationId !== organizationId) {
      throw new DataError('Parent role does not belong to this organization.');
    }

    const userMaxLevel = await this.getUserMaxLevel(userId, organizationId);
    const parentLevel = await this.deps.roleRepository.getRoleLevel(
      data.parentRoleId,
      organizationId,
    );

    if (parentLevel < userMaxLevel) {
      throw new ForbiddenError(
        'Cannot create roles above your permission level.',
      );
    }

    const builtPermissions = data.permissions
      ? await this.buildPermissions(data.permissions, organizationId, userId)
      : null;

    const existingChild = await this.deps.roleRepository.getChildRole(
      data.parentRoleId,
      organizationId,
    );

    if (!existingChild) {
      const role = await this.deps.roleRepository.createRole({
        organizationId,
        parentRoleId: data.parentRoleId,
        name,
        color,
        updatedBy: userId,
      });
      if (builtPermissions) {
        await this.addPermissions(role.idRole, builtPermissions);
      }
      return role;
    }

    await this.deps.roleRepository.updateRole(existingChild.idRole, {
      parentRoleId: null,
      updatedBy: userId,
    });

    let createdRole: Role | null = null;
    try {
      createdRole = await this.deps.roleRepository.createRole({
        organizationId,
        parentRoleId: data.parentRoleId,
        name,
        color,
        updatedBy: userId,
      });

      await this.deps.roleRepository.updateRole(existingChild.idRole, {
        parentRoleId: createdRole.idRole,
        updatedBy: userId,
      });

      if (builtPermissions) {
        await this.addPermissions(createdRole.idRole, builtPermissions);
      }

      return createdRole;
    } catch (error) {
      await Promise.allSettled([
        this.deps.roleRepository.updateRole(existingChild.idRole, {
          parentRoleId: data.parentRoleId,
          updatedBy: userId,
        }),
        createdRole
          ? this.deps.roleRepository.deleteRole(createdRole.idRole)
          : Promise.resolve(),
      ]);

      throw error;
    }
  }

  async updateRole(
    roleId: UUID,
    userId: UUID,
    data: UpdateRoleInput,
  ): Promise<Role> {
    const role = await this.deps.roleRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);

    const organizationId = role.organizationId;

    await this.requireMembership(userId, organizationId);

    const canEdit = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'role:edit',
    );
    const isAdmin = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'org:admin',
    );
    if (!canEdit && !isAdmin) {
      throw new ForbiddenError('Insufficient permissions to update roles.');
    }

    const roleLevel = await this.deps.roleRepository.getRoleLevel(
      roleId,
      organizationId,
    );
    if (roleLevel === 0) {
      throw new ForbiddenError('Cannot modify the top-level role.');
    }

    const userMaxLevel = await this.getUserMaxLevel(userId, organizationId);
    if (roleLevel < userMaxLevel) {
      throw new ForbiddenError(
        'Cannot modify roles above your permission level.',
      );
    }

    if (data.name && data.name.length > 50)
      throw new DataError('Role name cannot exceed 50 characters.');
    if (data.color && !isValidHexColor(data.color)) {
      throw new DataError(
        'Color must be a valid hexadecimal color (e.g. #A1B2C3).',
      );
    }

    const builtPermissions =
      data.permissions !== undefined
        ? await this.buildPermissions(data.permissions, organizationId, userId)
        : null;

    if (builtPermissions !== null) {
      await this.guardSelfPermissionModification(
        userId,
        organizationId,
        roleId,
      );
    }

    if (data.parentRoleId && data.parentRoleId !== role.parentRoleId) {
      if (!isValidUUID(data.parentRoleId)) {
        throw new DataError('parentRoleId must be a valid UUID.');
      }

      if (data.parentRoleId === roleId) {
        throw new DataError('A role cannot be its own parent.');
      }

      const newParent = await this.deps.roleRepository.findRoleById(
        data.parentRoleId,
      );
      if (!newParent) throw new NotFoundError('Role', data.parentRoleId);
      if (newParent.organizationId !== organizationId) {
        throw new DataError(
          'Parent role does not belong to this organization.',
        );
      }

      const newParentLevel = await this.deps.roleRepository.getRoleLevel(
        data.parentRoleId,
        organizationId,
      );
      if (newParentLevel < userMaxLevel) {
        throw new ForbiddenError(
          'Cannot place a role above your permission level.',
        );
      }

      // Chain splice: move this role to new position in the linked list
      const myChild = await this.deps.roleRepository.getChildRole(
        roleId,
        organizationId,
      );
      const newParentChild = await this.deps.roleRepository.getChildRole(
        data.parentRoleId,
        organizationId,
      );

      // Step 1: detach myChild from this role temporarily
      if (myChild) {
        await this.deps.roleRepository.updateRole(myChild.idRole, {
          parentRoleId: null,
          updatedBy: userId,
        });
      }

      // Step 2: detach newParent's current child temporarily (if different from myChild)
      if (newParentChild && newParentChild.idRole !== myChild?.idRole) {
        await this.deps.roleRepository.updateRole(newParentChild.idRole, {
          parentRoleId: null,
          updatedBy: userId,
        });
      }

      // Step 3: move this role to new parent
      await this.deps.roleRepository.updateRole(roleId, {
        parentRoleId: data.parentRoleId,
        name: data.name ?? role.name,
        color: data.color ?? role.color,
        updatedBy: userId,
      });

      // Step 4: re-parent myChild to this role's old parent
      if (myChild) {
        await this.deps.roleRepository.updateRole(myChild.idRole, {
          parentRoleId: role.parentRoleId ?? null,
          updatedBy: userId,
        });
      }

      // Step 5: insert newParentChild after this role
      if (newParentChild && newParentChild.idRole !== myChild?.idRole) {
        await this.deps.roleRepository.updateRole(newParentChild.idRole, {
          parentRoleId: roleId,
          updatedBy: userId,
        });
      }

      const updated = (await this.deps.roleRepository.findRoleById(roleId))!;
      if (builtPermissions !== null) {
        await this.addPermissions(roleId, builtPermissions);
      }
      return updated;
    }

    const updated = await this.deps.roleRepository.updateRole(roleId, {
      name: data.name ?? role.name,
      color: data.color ?? role.color,
      updatedBy: userId,
    });
    if (builtPermissions !== null) {
      await this.addPermissions(roleId, builtPermissions);
    }
    return updated;
  }

  async listRoles(organizationId: UUID, userId: UUID): Promise<Role[]> {
    await this.requireMembership(userId, organizationId);
    return this.deps.roleRepository.listRolesByOrganizationHierarchy(
      organizationId,
    );
  }

  async listSubordinateRoles(
    organizationId: UUID,
    userId: UUID,
  ): Promise<Role[]> {
    await this.requireMembership(userId, organizationId);

    const [allRoles, userMaxLevel] = await Promise.all([
      this.deps.roleRepository.listRolesByOrganizationHierarchy(organizationId),
      this.getUserMaxLevel(userId, organizationId),
    ]);

    return allRoles.slice(userMaxLevel + 1);
  }

  async deleteRole(roleId: UUID, userId: UUID): Promise<void> {
    const role = await this.deps.roleRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);

    const organizationId = role.organizationId;

    await this.requireMembership(userId, organizationId);

    const canDelete = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'role:delete',
    );
    const isAdmin = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'org:admin',
    );
    if (!canDelete && !isAdmin) {
      throw new ForbiddenError('Insufficient permissions to delete roles.');
    }

    const roleLevel = await this.deps.roleRepository.getRoleLevel(
      roleId,
      organizationId,
    );
    if (roleLevel === 0) {
      throw new ForbiddenError('Cannot delete the top-level role.');
    }

    const userMaxLevel = await this.getUserMaxLevel(userId, organizationId);
    if (roleLevel < userMaxLevel) {
      throw new ForbiddenError(
        'Cannot delete roles above your permission level.',
      );
    }

    const memberCount =
      await this.deps.roleRepository.getMembersCountInRole(roleId);
    if (memberCount > 0) {
      throw new DataError('Cannot delete a role that has assigned members.');
    }

    const child = await this.deps.roleRepository.getChildRole(
      roleId,
      organizationId,
    );

    if (child) {
      // Temporarily detach child so the unique constraint is freed when role is deleted
      await this.deps.roleRepository.updateRole(child.idRole, {
        parentRoleId: null,
        updatedBy: userId,
      });
      await this.deps.roleRepository.deleteRole(roleId);
      await this.deps.roleRepository.updateRole(child.idRole, {
        parentRoleId: role.parentRoleId ?? null,
        updatedBy: userId,
      });
    } else {
      await this.deps.roleRepository.deleteRole(roleId);
    }
  }

  private async requireMembership(
    userId: UUID,
    organizationId: UUID,
  ): Promise<void> {
    const member = await this.deps.organizationRepository.getMember(
      userId,
      organizationId,
    );
    if (!member) throw new NotFoundError('Organization', organizationId);
  }

  private async getUserMaxLevel(
    userId: UUID,
    organizationId: UUID,
  ): Promise<number> {
    const userRoles = await this.deps.roleRepository.getUserRoles(
      userId,
      organizationId,
    );

    if (!userRoles.length) return Infinity;

    const levels = await Promise.all(
      userRoles.map((r) =>
        this.deps.roleRepository.getRoleLevel(r.idRole, organizationId),
      ),
    );

    return Math.min(...levels);
  }

  private parsePermission(
    raw: string,
  ): { code: PermissionCode; datasourceId?: UUID; reportId?: UUID } | null {
    const parts = raw.split(':');
    if (parts.length < 2 || parts.length > 3) return null;

    const [resourceType, action, resourceId] = parts as [
      Resource,
      ACTION,
      string | undefined,
    ];

    if (!VALID_RESOURCES.has(resourceType) || !VALID_ACTIONS.has(action)) {
      return null;
    }

    const code = `${resourceType}:${action}` as PermissionCode;

    if (resourceId !== undefined) {
      if (!isValidUUID(resourceId)) return null;
      const uuid = resourceId;

      if (resourceType === Resource.DATASOURCE)
        return { code, datasourceId: uuid };
      if (resourceType === Resource.REPORT) return { code, reportId: uuid };
      return null;
    }

    return { code };
  }

  private async buildPermissions(
    rawPermissions: string[],
    organizationId: UUID,
    userId: UUID,
  ): Promise<
    Array<{ code: PermissionCode; datasourceId?: UUID; reportId?: UUID }>
  > {
    const result: Array<{
      code: PermissionCode;
      datasourceId?: UUID;
      reportId?: UUID;
    }> = [];

    for (const raw of rawPermissions) {
      const parsed = this.parsePermission(raw);
      if (!parsed) {
        throw new DataError(`Invalid permission format: "${raw}".`);
      }

      if (parsed.datasourceId) {
        const ds = await this.deps.datasourceRepository.findDatasourceById(
          parsed.datasourceId,
        );
        if (!ds) throw new NotFoundError('Datasource', parsed.datasourceId);
        if (ds.organizationId !== organizationId) {
          throw new DataError(
            `Datasource "${parsed.datasourceId}" does not belong to this organization.`,
          );
        }
        const hasAccess = await this.deps.permissionRepository.hasPermission(
          userId,
          organizationId,
          'ds:read',
          parsed.datasourceId,
          Resource.DATASOURCE,
        );
        if (!hasAccess) {
          throw new ForbiddenError(
            `You do not have access to datasource "${parsed.datasourceId}".`,
          );
        }
      }

      result.push(parsed);
    }

    return result;
  }

  private async addPermissions(
    roleId: UUID,
    permissions: Array<{
      code: PermissionCode;
      datasourceId?: UUID;
      reportId?: UUID;
    }>,
  ): Promise<void> {
    const existing =
      await this.deps.permissionRepository.listPermissionsByRole(roleId);

    const seen = new Set<string>();
    for (const p of permissions) {
      const key = `${p.code}:${p.datasourceId ?? ''}:${p.reportId ?? ''}`;
      if (seen.has(key)) continue;
      seen.add(key);

      const alreadyExists = existing.some(
        (e) =>
          e.code === p.code &&
          (e.datasourceId ?? null) === (p.datasourceId ?? null) &&
          (e.reportId ?? null) === (p.reportId ?? null),
      );
      if (!alreadyExists) {
        await this.deps.permissionRepository.createPermission({ roleId, ...p });
      }
    }
  }

  async removePermissions(
    roleId: UUID,
    userId: UUID,
    rawPermissions: string[],
  ): Promise<void> {
    const role = await this.deps.roleRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);

    const organizationId = role.organizationId;
    await this.requireMembership(userId, organizationId);

    const canEdit = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'role:edit',
    );
    const isAdmin = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'org:admin',
    );
    if (!canEdit && !isAdmin) {
      throw new ForbiddenError('Insufficient permissions to update roles.');
    }

    const roleLevel = await this.deps.roleRepository.getRoleLevel(
      roleId,
      organizationId,
    );
    if (roleLevel === 0) {
      throw new ForbiddenError('Cannot modify the top-level role.');
    }

    const userMaxLevel = await this.getUserMaxLevel(userId, organizationId);
    if (roleLevel < userMaxLevel) {
      throw new ForbiddenError(
        'Cannot modify roles above your permission level.',
      );
    }

    await this.guardSelfPermissionModification(userId, organizationId, roleId);

    for (const raw of rawPermissions) {
      const parsed = this.parsePermission(raw);
      if (!parsed) throw new DataError(`Invalid permission format: "${raw}".`);

      const existing = await this.deps.permissionRepository.findPermission(
        roleId,
        parsed.code,
        parsed.datasourceId,
        parsed.reportId,
      );
      if (existing) {
        await this.deps.permissionRepository.deletePermission(
          existing.permissionId,
        );
      }
    }
  }

  private async guardSelfPermissionModification(
    userId: UUID,
    organizationId: UUID,
    roleId: UUID,
  ): Promise<void> {
    const userRoles = await this.deps.roleRepository.getUserRoles(
      userId,
      organizationId,
    );
    if (!userRoles.length) return;

    const levels = await Promise.all(
      userRoles.map((r) =>
        this.deps.roleRepository.getRoleLevel(r.idRole, organizationId),
      ),
    );
    const minLevel = Math.min(...levels);
    const isTopRole = userRoles.some(
      (r, i) => levels[i] === minLevel && r.idRole === roleId,
    );
    if (isTopRole) {
      throw new ForbiddenError(
        'Cannot modify permissions of your highest-access role.',
      );
    }
  }
}
