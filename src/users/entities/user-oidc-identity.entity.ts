import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';

import { User } from './user.entity.js';

@Entity('user_oidc_identities')
@Index(['issuer', 'subject'], { unique: true })
@Index(['userId', 'issuer'], { unique: true })
export class UserOidcIdentity extends BaseEntity {
  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 512 })
  issuer!: string;

  @Column({ type: 'varchar', length: 255 })
  subject!: string;

  @Column({ type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  linkedAt!: Date;
}
