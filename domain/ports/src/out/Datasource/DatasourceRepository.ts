import { Datasource, Page } from '@insight-ai/domain-models';
import { UUID } from 'node:crypto';

export interface DatasourceRepository {
  createDatasource(
    data: Omit<Datasource, 'idDatasource' | 'createdAt' | 'updatedAt'>,
  ): Promise<Datasource>;
  deleteDatasource(datasourceId: UUID): Promise<void>;
  findDatasourceById(datasourceId: UUID): Promise<Datasource | null>;
  listAllByOrganization(
    organizationId: UUID,
    page?: number,
  ): Promise<Page<Datasource>>;
  listByCreatorOrIds(
    organizationId: UUID,
    options: { createdByUserId?: UUID; datasourceIds?: UUID[] },
    page?: number,
  ): Promise<Page<Datasource>>;
}
