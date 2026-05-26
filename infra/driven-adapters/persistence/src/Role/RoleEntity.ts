import {
  Entity,
  PrimaryColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UUID } from 'node:crypto';
import { OrganizationEntity } from '../Organization/OrganizationEntity';
import { PermissionEntity } from './PermissionEntity';
import { RoleMemberEntity } from './RoleMemberEntity';

@Entity('roles')
@Index(['organizationId', 'parentRoleId'], { unique: true })
export class RoleEntity {
  @PrimaryColumn('uuid')
  idRole: UUID;

  @Column('uuid')
  organizationId: UUID;

  @Column('uuid', { nullable: true })
  parentRoleId?: UUID;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 7 })
  color: string;

  @Column('uuid')
  updatedBy: UUID;

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

  @ManyToOne(() => RoleEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentRoleId' })
  parentRole?: RoleEntity;

  @OneToMany(() => PermissionEntity, (permission) => permission.role, {
    cascade: true,
  })
  permissions: PermissionEntity[];

  @OneToMany(() => RoleMemberEntity, (roleMember) => roleMember.role, {
    cascade: true,
  })
  roleMembers: RoleMemberEntity[];
}
