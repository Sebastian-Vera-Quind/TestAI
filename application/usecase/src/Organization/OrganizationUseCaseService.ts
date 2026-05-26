import {
  DataError,
  ForbiddenError,
  NotFoundError,
  PermissionCode,
  Resource,
  TOPLEVEL_ACTION,
  type Member,
  type Organization,
  type Page,
} from '@insight-ai/domain-models';
import {
  OrganizationListItem,
  type OrganizationUseCase,
} from '@insight-ai/domain-ports/in';
import {
  OrganizationRepository,
  PermissionRepository,
  RoleRepository,
  UserRepository,
} from '@insight-ai/domain-ports/out';
import { randomUUID, type UUID } from 'node:crypto';
import { generateVividRandomColorHex } from '../util';

const ADMIN_ROLE_NAME = 'Admin';
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface OrganizationUseCaseServiceDependencies {
  organizationRepository: OrganizationRepository;
  roleRepository: RoleRepository;
  permissionRepository: PermissionRepository;
  userRepository: UserRepository;
}

export class OrganizationUseCaseService implements OrganizationUseCase {
  constructor(
    private readonly dependencies: OrganizationUseCaseServiceDependencies,
  ) {}

  async createOrganization(name: string, userId: UUID): Promise<Organization> {
    const normalizedName = name.trim();

    if (!normalizedName) {
      throw new DataError('Organization name cannot be empty.');
    }

    const organization =
      await this.dependencies.organizationRepository.createOrganization({
        name: normalizedName,
      });

    const member =
      await this.dependencies.organizationRepository.addMemberToOrganization(
        organization.organizationId,
        userId,
      );

    const adminRole = await this.dependencies.roleRepository.createRole({
      organizationId: organization.organizationId,
      name: ADMIN_ROLE_NAME,
      color: generateVividRandomColorHex(),
      updatedBy: userId,
    });

    await Promise.all(
      this.getAdminPermissionCodes().map((code) =>
        this.dependencies.permissionRepository.createPermission({
          roleId: adminRole.idRole,
          code,
        }),
      ),
    );

    await this.dependencies.roleRepository.addMemberToRole(
      member.idMember,
      adminRole.idRole,
      userId,
    );

    return organization;
  }

  async listOrganizationsByUser(
    userId: UUID,
    page = 1,
  ): Promise<Page<OrganizationListItem>> {
    const organizations =
      await this.dependencies.organizationRepository.listOrganizations(
        userId,
        page,
      );

    const detailedOrganizations = organizations.items.map(async (org) => {
      const info =
        await this.dependencies.organizationRepository.getOrganizationInfo(
          org.organizationId,
          userId,
        );

      const canEdit =
        await this.dependencies.permissionRepository.hasPermission(
          userId,
          org.organizationId,
          `${Resource.ORG}:${TOPLEVEL_ACTION.ADMIN}` as PermissionCode,
        );

      return {
        ...org,
        ...info,
        canEdit,
      };
    });

    return {
      ...organizations,
      items: await Promise.all(detailedOrganizations),
    };
  }

  async toggleFavoriteOrganization(
    organizationId: UUID,
    userId: UUID,
  ): Promise<boolean> {
    return await this.dependencies.organizationRepository.toggleFavoriteMember(
      organizationId,
      userId,
    );
  }

  async searchOrganizationsByName(
    userId: UUID,
    name: string,
    page = 1,
  ): Promise<Page<OrganizationListItem>> {
    const organizations =
      await this.dependencies.organizationRepository.searchOrganizations(
        userId,
        name,
        page,
      );

    const detailedOrganizations = organizations.items.map(async (org) => {
      const info =
        await this.dependencies.organizationRepository.getOrganizationInfo(
          org.organizationId,
          userId,
        );

      const canEdit =
        await this.dependencies.permissionRepository.hasPermission(
          userId,
          org.organizationId,
          `${Resource.ORG}:${TOPLEVEL_ACTION.ADMIN}` as PermissionCode,
        );

      return {
        ...org,
        ...info,
        canEdit,
      };
    });

    return {
      ...organizations,
      items: await Promise.all(detailedOrganizations),
    };
  }

  async addMember(
    organizationId: UUID,
    actorUserId: UUID,
    email: string,
    roleId: UUID,
  ): Promise<Member> {
    await this.requireMembership(actorUserId, organizationId);

    const [canAssign, canAdd] = await Promise.all([
      this.dependencies.permissionRepository.hasPermission(
        actorUserId,
        organizationId,
        'role:assign',
      ),
      this.dependencies.permissionRepository.hasPermission(
        actorUserId,
        organizationId,
        'org:add_member',
      ),
    ]);
    if (!canAssign && !canAdd) {
      throw new ForbiddenError('Insufficient permissions to add members.');
    }

    if (!EMAIL_RE.test(email)) {
      throw new DataError('Invalid email address.');
    }

    let targetUser =
      await this.dependencies.userRepository.findUserByEmail(email);
    if (!targetUser) {
      const newUserId = randomUUID();
      await this.dependencies.userRepository.createUser({
        idUser: newUserId,
        name: email.split('@')[0],
        email,
        validated: false,
      });
      targetUser =
        await this.dependencies.userRepository.findUserById(newUserId);
    }

    const targetUserId = targetUser!.idUser;

    const existing = await this.dependencies.organizationRepository.getMember(
      targetUserId,
      organizationId,
    );
    if (existing) {
      throw new DataError('User is already a member of this organization.');
    }

    const role = await this.dependencies.roleRepository.findRoleById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);
    if (role.organizationId !== organizationId) {
      throw new DataError('Role does not belong to this organization.');
    }

    const actorMaxLevel = await this.getUserMaxLevel(
      actorUserId,
      organizationId,
    );
    const roleLevel = await this.dependencies.roleRepository.getRoleLevel(
      roleId,
      organizationId,
    );

    if (roleLevel <= actorMaxLevel) {
      throw new ForbiddenError(
        'You can only assign roles below your own hierarchy level.',
      );
    }

    const member =
      await this.dependencies.organizationRepository.addMemberToOrganization(
        organizationId,
        targetUserId,
        actorUserId,
      );

    await this.dependencies.roleRepository.addMemberToRole(
      member.idMember,
      roleId,
      actorUserId,
    );

    return member;
  }

  async removeMember(
    organizationId: UUID,
    actorUserId: UUID,
    targetUserId: UUID,
  ): Promise<void> {
    await this.requireMembership(actorUserId, organizationId);

    const [isAdmin, canRemove] = await Promise.all([
      this.dependencies.permissionRepository.hasPermission(
        actorUserId,
        organizationId,
        'org:admin',
      ),
      this.dependencies.permissionRepository.hasPermission(
        actorUserId,
        organizationId,
        'org:remove_member',
      ),
    ]);
    if (!isAdmin && !canRemove) {
      throw new ForbiddenError('Insufficient permissions to remove members.');
    }

    if (actorUserId === targetUserId) {
      throw new DataError('You cannot remove yourself from the organization.');
    }

    const targetMember =
      await this.dependencies.organizationRepository.getMember(
        targetUserId,
        organizationId,
      );
    if (!targetMember) {
      throw new NotFoundError('Member', targetUserId);
    }

    const actorMaxLevel = await this.getUserMaxLevel(
      actorUserId,
      organizationId,
    );
    const targetMaxLevel = await this.getUserMaxLevel(
      targetUserId,
      organizationId,
    );

    if (targetMaxLevel < actorMaxLevel) {
      throw new ForbiddenError(
        'You cannot remove a member with a higher hierarchy level than your own.',
      );
    }

    await this.dependencies.organizationRepository.removeMemberFromOrganization(
      organizationId,
      targetUserId,
      actorUserId,
    );
  }

  async editOrganization(
    organizationId: UUID,
    actorUserId: UUID,
    name: string,
  ): Promise<Organization> {
    await this.requireMembership(actorUserId, organizationId);

    const [isAdmin, canEdit] = await Promise.all([
      this.dependencies.permissionRepository.hasPermission(
        actorUserId,
        organizationId,
        'org:admin',
      ),
      this.dependencies.permissionRepository.hasPermission(
        actorUserId,
        organizationId,
        'org:edit',
      ),
    ]);
    if (!isAdmin && !canEdit) {
      throw new ForbiddenError(
        'Insufficient permissions to edit this organization.',
      );
    }

    const normalizedName = name.trim();
    if (!normalizedName) {
      throw new DataError('Organization name cannot be empty.');
    }

    return this.dependencies.organizationRepository.updateOrganization(
      organizationId,
      { name: normalizedName },
    );
  }

  private async requireMembership(
    userId: UUID,
    organizationId: UUID,
  ): Promise<void> {
    const member = await this.dependencies.organizationRepository.getMember(
      userId,
      organizationId,
    );
    if (!member) throw new NotFoundError('Organization', organizationId);
  }

  private async getUserMaxLevel(
    userId: UUID,
    organizationId: UUID,
  ): Promise<number> {
    const userRoles = await this.dependencies.roleRepository.getUserRoles(
      userId,
      organizationId,
    );

    if (!userRoles.length) return Infinity;

    const levels = await Promise.all(
      userRoles.map((r) =>
        this.dependencies.roleRepository.getRoleLevel(r.idRole, organizationId),
      ),
    );

    return Math.min(...levels);
  }

  private getAdminPermissionCodes(): PermissionCode[] {
    return [
      `${Resource.ORG}:${TOPLEVEL_ACTION.ADMIN}`,
      `${Resource.DATASOURCE}:${TOPLEVEL_ACTION.ADMIN}`,
      `${Resource.REPORT}:${TOPLEVEL_ACTION.ADMIN}`,
      `${Resource.ROLE}:${TOPLEVEL_ACTION.ADMIN}`,
    ];
  }
}
