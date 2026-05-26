import {
  Role,
  Page,
  RoleMember,
  NotFoundError,
} from '@insight-ai/domain-models';
import { RoleRepository, RoleUpdateData } from '@insight-ai/domain-ports/out';
import { UUID, randomUUID } from 'node:crypto';
import { RoleEntity } from './RoleEntity';
import { AbstractRepository } from '../config';
import { RoleMemberEntity } from './RoleMemberEntity';
import { MemberEntity } from '../Organization/MemberEntity';

export class RoleRepositoryAdapter
  extends AbstractRepository<RoleEntity>
  implements RoleRepository
{
  constructor() {
    super(RoleEntity);
  }

  async createRole(
    role: Omit<Role, 'idRole' | 'createdAt' | 'updatedAt'>,
  ): Promise<Role> {
    const repository = await this.getRepository();
    const persistRole: Partial<RoleEntity> = {
      idRole: randomUUID(),
      organizationId: role.organizationId,
      parentRoleId: role.parentRoleId,
      name: role.name,
      color: role.color,
      updatedBy: role.updatedBy,
    };

    return repository.save(repository.create(persistRole));
  }

  async updateRole(roleId: UUID, data: RoleUpdateData): Promise<Role> {
    const repository = await this.getRepository();
    const role = await repository.findOne({ where: { idRole: roleId } });

    if (!role) throw new NotFoundError('Role', roleId);

    if (data.name !== undefined) role.name = data.name;
    if (data.color !== undefined) role.color = data.color;
    if (data.updatedBy !== undefined) role.updatedBy = data.updatedBy;
    if ('parentRoleId' in data) {
      if (data.parentRoleId !== null && data.parentRoleId !== undefined) {
        role.parentRoleId = data.parentRoleId;
      } else {
        role.parentRoleId = undefined;
        await repository.save(role);
        await repository
          .createQueryBuilder()
          .update()
          .set({ parentRoleId: () => 'NULL' })
          .where({ idRole: roleId })
          .execute();
        return (await repository.findOne({ where: { idRole: roleId } }))!;
      }
    }

    return repository.save(role);
  }

  async deleteRole(roleId: UUID): Promise<void> {
    const repository = await this.getRepository();
    await repository.delete({ idRole: roleId });
  }

  async findRoleById(roleId: UUID): Promise<Role | null> {
    const repository = await this.getRepository();
    return repository.findOne({ where: { idRole: roleId } });
  }

  async getChildRole(
    parentRoleId: UUID,
    organizationId: UUID,
  ): Promise<Role | null> {
    const repository = await this.getRepository();
    return repository.findOne({ where: { parentRoleId, organizationId } });
  }

  async getRoleLevel(roleId: UUID, organizationId: UUID): Promise<number> {
    const repository = await this.getRepository();
    let currentId: UUID | undefined = roleId;
    let level = 0;

    while (currentId) {
      const role = await repository.findOne({
        where: { idRole: currentId, organizationId },
        select: ['idRole', 'parentRoleId'],
      });
      if (!role || !role.parentRoleId) break;
      currentId = role.parentRoleId;
      level++;
    }

    return level;
  }

  async getMembersCountInRole(roleId: UUID): Promise<number> {
    const roleMemberRepository =
      await this.getAnotherRepository(RoleMemberEntity);
    return roleMemberRepository.count({ where: { roleId } });
  }

  async listRolesByOrganizationHierarchy(
    organizationId: UUID,
  ): Promise<Role[]> {
    const repository = await this.getRepository();
    const all = await repository.find({ where: { organizationId } });

    const result: RoleEntity[] = [];
    let current: RoleEntity | undefined = all.find((r) => !r.parentRoleId);

    while (current) {
      result.push(current);
      const next = all.find((r) => r.parentRoleId === current!.idRole);
      current = next;
    }

    return result;
  }

  async getUserRoles(userId: UUID, organizationId: UUID): Promise<Role[]> {
    const repository = await this.getRepository();

    return repository
      .createQueryBuilder('role')
      .innerJoin('role.roleMembers', 'roleMember')
      .innerJoin(
        MemberEntity,
        'member',
        'member.idMember = roleMember.memberId AND member.userId = :userId AND member.organizationId = :organizationId',
        { userId, organizationId },
      )
      .where('role.organizationId = :organizationId', { organizationId })
      .getMany();
  }

  async getMemberRoles(memberId: UUID, organizationId: UUID): Promise<Role[]> {
    const repository = await this.getRepository();

    return repository
      .createQueryBuilder('role')
      .innerJoin(
        'role.roleMembers',
        'roleMember',
        'roleMember.memberId = :memberId',
        { memberId },
      )
      .where('role.organizationId = :organizationId', { organizationId })
      .getMany();
  }

  async listRolesByOrganization(
    organizationId: UUID,
    page: number = 1,
  ): Promise<Page<Role>> {
    const repository = await this.getRepository();

    const [roles, total] = await repository
      .createQueryBuilder('role')
      .where('role.organizationId = :organizationId', { organizationId })
      .skip((page - 1) * 10)
      .take(10)
      .getManyAndCount();

    return {
      items: roles,
      total,
      totalPages: Math.ceil(total / 10),
      hasNext: page * 10 < total,
    };
  }

  async listMemberRoles(
    memberId: UUID,
    organizationId: UUID,
    page: number = 1,
  ): Promise<Page<Role>> {
    const repository = await this.getRepository();

    const [roles, total] = await repository
      .createQueryBuilder('role')
      .innerJoin(
        'role.roleMembers',
        'roleMember',
        'roleMember.memberId = :memberId',
        { memberId },
      )
      .where('role.organizationId = :organizationId', { organizationId })
      .skip((page - 1) * 10)
      .take(10)
      .getManyAndCount();

    return {
      items: roles,
      total,
      totalPages: Math.ceil(total / 10),
      hasNext: page * 10 < total,
    };
  }

  async addMemberToRole(
    memberId: UUID,
    roleId: UUID,
    assignedByUserId?: UUID,
  ): Promise<RoleMember> {
    const repository = await this.getRepository();

    const role = await repository.findOne({
      where: { idRole: roleId },
      relations: ['roleMembers'],
    });

    if (!role) {
      throw new NotFoundError('Role', roleId);
    }

    const roleMemberRepository =
      await this.getAnotherRepository(RoleMemberEntity);

    const newRoleMember: RoleMember = {
      memberId,
      roleId,
      assignedAt: new Date(),
      assignedByUserId,
    };

    const roleMemberEntity = roleMemberRepository.create(newRoleMember);
    return roleMemberRepository.save(roleMemberEntity);
  }

  async removeMemberFromRole(memberId: UUID, roleId: UUID): Promise<void> {
    const roleMemberRepository =
      await this.getAnotherRepository(RoleMemberEntity);
    await roleMemberRepository.delete({ memberId, roleId });
  }
}
