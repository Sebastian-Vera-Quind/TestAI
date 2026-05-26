import { randomUUID, type UUID } from 'node:crypto';
import { Datasource, DatasourceType, Page } from '@insight-ai/domain-models';
import { DatasourceRepository } from '@insight-ai/domain-ports/out';
import { AbstractRepository } from '../config';
import { DatasourceEntity } from './DatasourceEntity';

const PAGE_SIZE = 10;

export class DatasourceRepositoryAdapter
  extends AbstractRepository<DatasourceEntity>
  implements DatasourceRepository
{
  constructor() {
    super(DatasourceEntity);
  }

  async createDatasource(
    data: Omit<Datasource, 'idDatasource' | 'createdAt' | 'updatedAt'>,
  ): Promise<Datasource> {
    const repository = await this.getRepository();
    const entity = repository.create({
      idDatasource: randomUUID(),
      organizationId: data.organizationId,
      createdByUserId: data.createdByUserId,
      name: data.name,
      type: data.type as string,
      host: data.host,
      port: data.port,
      username: data.username,
      password: data.password,
      database: data.database,
    });
    const saved = await repository.save(entity);
    return this.toModel(saved);
  }

  async deleteDatasource(datasourceId: UUID): Promise<void> {
    const repository = await this.getRepository();
    await repository.delete({ idDatasource: datasourceId });
  }

  async findDatasourceById(datasourceId: UUID): Promise<Datasource | null> {
    const repository = await this.getRepository();
    const entity = await repository.findOneBy({ idDatasource: datasourceId });
    return entity ? this.toModel(entity) : null;
  }

  async listAllByOrganization(
    organizationId: UUID,
    page = 1,
  ): Promise<Page<Datasource>> {
    const repository = await this.getRepository();
    const offset = (page - 1) * PAGE_SIZE;

    const [entities, total] = await repository.findAndCount({
      where: { organizationId },
      skip: offset,
      take: PAGE_SIZE,
      order: { createdAt: 'DESC' },
    });

    return {
      items: entities.map((e) => this.toModel(e)),
      total,
      hasNext: offset + PAGE_SIZE < total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  async listByCreatorOrIds(
    organizationId: UUID,
    options: { createdByUserId?: UUID; datasourceIds?: UUID[] },
    page = 1,
  ): Promise<Page<Datasource>> {
    const { createdByUserId, datasourceIds = [] } = options;

    if (!createdByUserId && datasourceIds.length === 0) {
      return { items: [], total: 0, hasNext: false, totalPages: 0 };
    }

    const repository = await this.getRepository();
    const offset = (page - 1) * PAGE_SIZE;

    const query = repository
      .createQueryBuilder('ds')
      .where('ds.organizationId = :organizationId', { organizationId });

    const conditions: string[] = [];
    if (createdByUserId) {
      conditions.push('ds.createdByUserId = :createdByUserId');
      query.setParameter('createdByUserId', createdByUserId);
    }
    if (datasourceIds.length > 0) {
      conditions.push('ds.idDatasource IN (:...datasourceIds)');
      query.setParameter('datasourceIds', datasourceIds);
    }

    query.andWhere(`(${conditions.join(' OR ')})`);
    query.orderBy('ds.createdAt', 'DESC').skip(offset).take(PAGE_SIZE);

    const [entities, total] = await query.getManyAndCount();

    return {
      items: entities.map((e) => this.toModel(e)),
      total,
      hasNext: offset + PAGE_SIZE < total,
      totalPages: Math.ceil(total / PAGE_SIZE),
    };
  }

  private toModel(entity: DatasourceEntity): Datasource {
    return {
      idDatasource: entity.idDatasource,
      organizationId: entity.organizationId,
      createdByUserId: entity.createdByUserId,
      name: entity.name,
      type: entity.type as DatasourceType,
      host: entity.host,
      port: entity.port,
      username: entity.username,
      password: entity.password,
      database: entity.database,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
