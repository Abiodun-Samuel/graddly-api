import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('users')
export class User extends BaseEntity {
  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  @Column({ select: false })
  password!: string;

  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl!: string | null;
}
