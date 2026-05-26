import { UUID } from 'node:crypto';
import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { MemberEntity } from '../Organization';
import { RoleEntity } from './RoleEntity';

@Entity('role_member')
export class RoleMemberEntity {
  @PrimaryColumn('uuid')
  memberId: UUID;
  @PrimaryColumn('uuid')
  roleId: UUID;
  assignedAt: Date;
  assignedByUserId?: UUID;

  @ManyToOne(() => MemberEntity, (member) => member.roleMembers)
  @JoinColumn({ name: 'memberId' })
  member: MemberEntity;

  @ManyToOne(() => RoleEntity, (role) => role.roleMembers)
  @JoinColumn({ name: 'roleId' })
  role: RoleEntity;

  @ManyToOne(() => MemberEntity, { nullable: true })
  @JoinColumn({ name: 'assignedByUserId' })
  assignedByUser?: MemberEntity;
}
