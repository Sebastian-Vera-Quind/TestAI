import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { UUID } from 'node:crypto';
import { PermissionCode } from '@insight-ai/domain-models';
import { RoleEntity } from './RoleEntity';

@Entity('permissions')
export class PermissionEntity {
  @PrimaryColumn('uuid')
  permissionId: UUID;

  @Column('uuid')
  roleId: UUID;

  @Column('varchar', { length: 50 })
  code: PermissionCode;

  @Column('uuid', { nullable: true })
  datasourceId?: UUID;

  @Column('uuid', { nullable: true })
  reportId?: UUID;

  @ManyToOne(() => RoleEntity, (role) => role.permissions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'roleId' })
  role: RoleEntity;

  validate(): boolean {
    return !(this.reportId && this.datasourceId);
  }
}
