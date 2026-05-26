import { UUID } from 'node:crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
} from 'typeorm';
import { OrganizationEntity } from '..';
import { UserEntity } from '../User';
import { RoleMemberEntity } from '../Role/RoleMemberEntity';

@Entity('member')
@Index(['organizationId', 'userId'], { unique: true })
export class MemberEntity {
  @PrimaryColumn('uuid')
  idMember: UUID;

  @Column('uuid')
  organizationId: UUID;
  @Column('uuid')
  userId: UUID;

  @Column('boolean', { default: false })
  isFavorite: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => OrganizationEntity, (organization) => organization.members)
  @JoinColumn({ name: 'organizationId' })
  OrganizationEntity: OrganizationEntity;

  @ManyToOne(() => UserEntity, (user) => user.members)
  @JoinColumn({ name: 'userId' })
  user: UserEntity;

  @OneToMany(() => RoleMemberEntity, (roleMember) => roleMember.member, {
    cascade: true,
  })
  roleMembers: RoleMemberEntity[];
}
