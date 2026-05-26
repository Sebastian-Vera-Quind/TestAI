import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { UUID } from 'node:crypto';
import { MemberEntity } from './MemberEntity';
import { RoleEntity } from '../Role';

@Entity('organizations')
export class OrganizationEntity {
  @PrimaryColumn('uuid')
  organizationId: UUID;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('text', { nullable: true })
  imageUrl?: string;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @OneToMany(() => MemberEntity, (member) => member.OrganizationEntity, {
    cascade: true,
  })
  members: MemberEntity[];

  @OneToMany(() => RoleEntity, (role) => role.organization, {
    cascade: true,
  })
  roles: RoleEntity[];
}
