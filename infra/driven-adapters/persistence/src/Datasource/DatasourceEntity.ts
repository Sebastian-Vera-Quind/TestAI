import { Column, Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { UUID } from 'node:crypto';
import { OrganizationEntity } from '../Organization/OrganizationEntity';

@Entity('datasources')
export class DatasourceEntity {
  @PrimaryColumn('uuid')
  idDatasource: UUID;

  @Column('uuid')
  organizationId: UUID;

  @Column('uuid')
  createdByUserId: UUID;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 50 })
  type: string;

  @Column('varchar', { length: 255 })
  host: string;

  @Column('integer')
  port: number;

  @Column('varchar', { length: 255 })
  username: string;

  @Column('varchar', { length: 255 })
  password: string;

  @Column('varchar', { length: 255 })
  database: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => OrganizationEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organizationId' })
  organization: OrganizationEntity;
}
