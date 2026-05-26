import { randomUUID, type UUID } from 'node:crypto';
import {
  DataError,
  Permission,
  PermissionCode,
  PERMISSION_COVERS,
  Resource,
} from '@insight-ai/domain-models';
import { PermissionRepository } from '@insight-ai/domain-ports/out';
import { AbstractRepository } from '../config';
import { PermissionEntity } from './PermissionEntity';

export class PermissionRepositoryAdapter
  extends AbstractRepository<PermissionEntity>
  implements PermissionRepository
{
  constructor() {
    super(PermissionEntity);
  }

  async getMemberPermissions(
    memberId: UUID,
    organizationId: UUID,
  ): Promise<Permission[]> {
    const repository = await this.getRepository();

    return repository
      .createQueryBuilder('permission')
      .distinct(true)
      .innerJoin('permission.role', 'role')
      .innerJoin('role.roleMembers', 'roleMember')
      .where('roleMember.memberId = :memberId', { memberId })
      .andWhere('role.organizationId = :organizationId', { organizationId })
      .getMany();
  }

  async getUserPermissions(
    userId: UUID,
    organizationId: UUID,
  ): Promise<Permission[]> {
    const repository = await this.getRepository();

    return repository
      .createQueryBuilder('permission')
      .distinct(true)
      .innerJoin('permission.role', 'role')
      .innerJoin('role.roleMembers', 'roleMember')
      .innerJoin('roleMember.member', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('role.organizationId = :organizationId', { organizationId })
      .getMany();
  }

  async getRolePermissions(roleId: UUID): Promise<Permission[]> {
    const repository = await this.getRepository();

    return repository.find({
      where: { roleId },
    });
  }

  async getRolePermission(roleId: UUID): Promise<Permission[]> {
    return this.getRolePermissions(roleId);
  }

  async getUserPermissionsByResource(
    userId: UUID,
    organizationId: UUID,
    resource: UUID,
    resourceType: Resource,
  ): Promise<Permission[]> {
    const repository = await this.getRepository();

    const query = repository
      .createQueryBuilder('permission')
      .distinct(true)
      .innerJoin('permission.role', 'role')
      .innerJoin('role.roleMembers', 'roleMember')
      .innerJoin('roleMember.member', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('role.organizationId = :organizationId', { organizationId })
      .andWhere('permission.code LIKE :codePrefix', {
        codePrefix: `${resourceType}:%`,
      });

    if (resourceType === Resource.DATASOURCE) {
      query.andWhere(
        '(permission.datasourceId = :resource OR permission.datasourceId IS NULL)',
        { resource },
      );
    }

    if (resourceType === Resource.REPORT) {
      query.andWhere(
        '(permission.reportId = :resource OR permission.reportId IS NULL)',
        { resource },
      );
    }

    return query.getMany();
  }

  async findPermission(
    roleId: UUID,
    code: PermissionCode,
    datasourceId?: UUID,
    reportId?: UUID,
  ): Promise<Permission | null> {
    const repository = await this.getRepository();

    const query = repository
      .createQueryBuilder('permission')
      .where('permission.roleId = :roleId', { roleId })
      .andWhere('permission.code = :code', { code });

    if (datasourceId) {
      query.andWhere('permission.datasourceId = :datasourceId', {
        datasourceId,
      });
    } else {
      query.andWhere('permission.datasourceId IS NULL');
    }

    if (reportId) {
      query.andWhere('permission.reportId = :reportId', { reportId });
    } else {
      query.andWhere('permission.reportId IS NULL');
    }

    return query.getOne();
  }

  async hasRolePermission(
    roleId: UUID,
    code: PermissionCode,
    resourceId?: UUID,
    resourceType?: Resource,
  ): Promise<boolean> {
    const repository = await this.getRepository();
    const allowedCodes = this.getCodesGrantingPermission(code);

    const query = repository
      .createQueryBuilder('permission')
      .where('permission.roleId = :roleId', { roleId })
      .andWhere('permission.code IN (:...allowedCodes)', { allowedCodes });

    if (resourceId && resourceType === Resource.DATASOURCE) {
      query.andWhere(
        '(permission.datasourceId = :resourceId OR permission.datasourceId IS NULL)',
        { resourceId },
      );
    }

    if (resourceId && resourceType === Resource.REPORT) {
      query.andWhere(
        '(permission.reportId = :resourceId OR permission.reportId IS NULL)',
        { resourceId },
      );
    }

    const count = await query.getCount();
    return count > 0;
  }

  async hasPermission(
    userId: UUID,
    organizationId: UUID,
    code: PermissionCode,
    resource?: UUID,
    resourceType?: Resource,
  ): Promise<boolean> {
    const repository = await this.getRepository();
    const allowedCodes = this.getCodesGrantingPermission(code);

    const query = repository
      .createQueryBuilder('permission')
      .innerJoin('permission.role', 'role')
      .innerJoin('role.roleMembers', 'roleMember')
      .innerJoin('roleMember.member', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('role.organizationId = :organizationId', { organizationId })
      .andWhere('permission.code IN (:...allowedCodes)', { allowedCodes });

    if (resource && resourceType === Resource.DATASOURCE) {
      query.andWhere(
        '(permission.datasourceId = :resource OR permission.datasourceId IS NULL)',
        { resource },
      );
    }

    if (resource && resourceType === Resource.REPORT) {
      query.andWhere(
        '(permission.reportId = :resource OR permission.reportId IS NULL)',
        { resource },
      );
    }

    const count = await query.getCount();
    return count > 0;
  }

  async createPermission(
    permission: Omit<Permission, 'permissionId'>,
  ): Promise<Permission> {
    if (permission.datasourceId && permission.reportId) {
      throw new DataError(
        'A permission cannot reference both datasourceId and reportId.',
      );
    }

    const repository = await this.getRepository();

    const permissionEntity = repository.create({
      permissionId: randomUUID(),
      roleId: permission.roleId,
      code: permission.code,
      datasourceId: permission.datasourceId,
      reportId: permission.reportId,
    });

    return repository.save(permissionEntity);
  }

  async deletePermission(permissionId: UUID): Promise<void> {
    const repository = await this.getRepository();

    await repository.delete({ permissionId });
  }

  async listPermissionsByRole(roleId: UUID): Promise<Permission[]> {
    return this.getRolePermissions(roleId);
  }

  async getAccessibleDatasourceIds(
    userId: UUID,
    organizationId: UUID,
  ): Promise<UUID[]> {
    const repository = await this.getRepository();

    const rows = await repository
      .createQueryBuilder('permission')
      .select('DISTINCT permission.datasourceId', 'datasourceId')
      .innerJoin('permission.role', 'role')
      .innerJoin('role.roleMembers', 'roleMember')
      .innerJoin('roleMember.member', 'member')
      .where('member.userId = :userId', { userId })
      .andWhere('role.organizationId = :organizationId', { organizationId })
      .andWhere('permission.code LIKE :prefix', { prefix: 'ds:%' })
      .andWhere('permission.datasourceId IS NOT NULL')
      .getRawMany<{ datasourceId: UUID }>();

    return rows.map((r) => r.datasourceId);
  }

  private getCodesGrantingPermission(code: PermissionCode): PermissionCode[] {
    const grantedBy = Object.entries(PERMISSION_COVERS)
      .filter(([, coveredCodes]) =>
        coveredCodes?.some((coveredCode) => coveredCode === code),
      )
      .map(([topLevelCode]) => topLevelCode as PermissionCode);

    return Array.from(new Set<PermissionCode>([code, ...grantedBy]));
  }
}
