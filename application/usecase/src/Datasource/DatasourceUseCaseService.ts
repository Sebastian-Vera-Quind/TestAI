import {
  DataError,
  Datasource,
  DatasourceType,
  ForbiddenError,
  NotFoundError,
  Page,
  Resource,
} from '@insight-ai/domain-models';
import {
  CreateDatasourceInput,
  DatasourceUseCase,
  TestConnectionInput,
} from '@insight-ai/domain-ports/in';
import {
  DatasourceRepository,
  OrganizationRepository,
  PermissionRepository,
  RoleRepository,
} from '@insight-ai/domain-ports/out';
import { UUID } from 'node:crypto';
import { generateVividRandomColorHex } from '../util';
import { resolveConnectionConfig } from './util';

export interface DatasourceUseCaseServiceDependencies {
  datasourceRepository: DatasourceRepository;
  organizationRepository: OrganizationRepository;
  permissionRepository: PermissionRepository;
  roleRepository: RoleRepository;
}

// TODOL replace with real driver call when engine adapter is ready.
// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
async function checkDatabaseConnection(_config: {
  type: DatasourceType;
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}): Promise<boolean> {
  return true;
}

export class DatasourceUseCaseService implements DatasourceUseCase {
  constructor(private readonly deps: DatasourceUseCaseServiceDependencies) {}

  async testConnection(
    organizationId: UUID,
    userId: UUID,
    data: TestConnectionInput,
  ): Promise<boolean> {
    await this.requireMembership(userId, organizationId);
    await this.requireCreatePermission(userId, organizationId);

    const config = resolveConnectionConfig(data);
    return checkDatabaseConnection(config);
  }

  async createDatasource(
    organizationId: UUID,
    userId: UUID,
    data: CreateDatasourceInput,
  ): Promise<Datasource> {
    await this.requireMembership(userId, organizationId);
    await this.requireCreatePermission(userId, organizationId);

    const name = data.name?.trim();
    if (!name) throw new DataError('Datasource name cannot be empty.');

    const config = resolveConnectionConfig(data);

    const connected = await checkDatabaseConnection(config);
    if (!connected) {
      throw new DataError(
        'Could not connect to the database. Please check the connection settings.',
      );
    }

    const datasource = await this.deps.datasourceRepository.createDatasource({
      organizationId,
      createdByUserId: userId,
      name,
      ...config,
    });

    const role = await this.deps.roleRepository.createRole({
      organizationId,
      name: datasource.name,
      color: generateVividRandomColorHex(),
      updatedBy: userId,
    });

    await this.deps.permissionRepository.createPermission({
      roleId: role.idRole,
      code: `${Resource.DATASOURCE}:admin`,
      datasourceId: datasource.idDatasource,
    });

    const member = await this.deps.organizationRepository.getMember(
      userId,
      organizationId,
    );
    if (member) {
      await this.deps.roleRepository.addMemberToRole(
        member.idMember,
        role.idRole,
        userId,
      );
    }

    return datasource;
  }

  async listDatasources(
    organizationId: UUID,
    userId: UUID,
    page = 1,
  ): Promise<Page<Datasource>> {
    await this.requireMembership(userId, organizationId);

    const [hasOrgAdmin, hasOrgManage] = await Promise.all([
      this.deps.permissionRepository.hasPermission(
        userId,
        organizationId,
        'org:admin',
      ),
      this.deps.permissionRepository.hasPermission(
        userId,
        organizationId,
        'org:manage',
      ),
    ]);

    if (hasOrgAdmin || hasOrgManage) {
      return this.deps.datasourceRepository.listAllByOrganization(
        organizationId,
        page,
      );
    }

    const [hasOrgCreate, datasourceIds] = await Promise.all([
      this.deps.permissionRepository.hasPermission(
        userId,
        organizationId,
        'org:create',
      ),
      this.deps.permissionRepository.getAccessibleDatasourceIds(
        userId,
        organizationId,
      ),
    ]);

    return this.deps.datasourceRepository.listByCreatorOrIds(
      organizationId,
      {
        createdByUserId: hasOrgCreate ? userId : undefined,
        datasourceIds,
      },
      page,
    );
  }

  async deleteDatasource(datasourceId: UUID, userId: UUID): Promise<void> {
    const datasource =
      await this.deps.datasourceRepository.findDatasourceById(datasourceId);
    if (!datasource) throw new NotFoundError('Datasource', datasourceId);

    const { organizationId } = datasource;
    await this.requireMembership(userId, organizationId);

    const [hasOrgAdmin, hasOrgManage, hasDsDelete] = await Promise.all([
      this.deps.permissionRepository.hasPermission(
        userId,
        organizationId,
        'org:admin',
      ),
      this.deps.permissionRepository.hasPermission(
        userId,
        organizationId,
        'org:manage',
      ),
      this.deps.permissionRepository.hasPermission(
        userId,
        organizationId,
        'ds:delete',
        datasourceId,
        Resource.DATASOURCE,
      ),
    ]);

    if (!hasOrgAdmin && !hasOrgManage && !hasDsDelete) {
      throw new ForbiddenError(
        'Insufficient permissions to delete this datasource.',
      );
    }

    await this.deps.datasourceRepository.deleteDatasource(datasourceId);
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

  private async requireCreatePermission(
    userId: UUID,
    organizationId: UUID,
  ): Promise<void> {
    const canCreate = await this.deps.permissionRepository.hasPermission(
      userId,
      organizationId,
      'org:create',
    );
    if (!canCreate) {
      throw new ForbiddenError(
        'Insufficient permissions. Required: org:admin, org:manage or org:create.',
      );
    }
  }
}
