import { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { Database } from './database';

export class AbstractRepository<T extends ObjectLiteral> {
  constructor(
    protected entity: EntityTarget<T>,
    protected dataSource: Promise<DataSource> = Database.getInstance(),
  ) {}

  protected async getRepository() {
    const dataSource = await this.dataSource;
    return dataSource.getRepository<T>(this.entity);
  }

  protected async getAnotherRepository<Entity extends ObjectLiteral>(
    entity: EntityTarget<Entity>,
  ) {
    const dataSource = await this.dataSource;
    return dataSource.getRepository<Entity>(entity);
  }
}
