import { Entity, PrimaryColumn, Column, Index, ManyToOne } from 'typeorm';
import { UUID } from 'node:crypto';
import { MemberEntity } from '../Organization';

@Entity('users')
@Index('IDX_USER_EMAIL', ['email'], { unique: true })
export class UserEntity {
  @PrimaryColumn('uuid')
  idUser: UUID;

  @Column('varchar', { length: 255 })
  name: string;

  @Column('varchar', { length: 255, unique: true })
  email: string;

  @Column('text', { nullable: true })
  imageUrl?: string;

  @Column('boolean', { default: false })
  validated: boolean;

  @Column('timestamp', { default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column('timestamp', {
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updatedAt: Date;

  @ManyToOne(() => MemberEntity, (member) => member.user)
  members: MemberEntity[];
}
