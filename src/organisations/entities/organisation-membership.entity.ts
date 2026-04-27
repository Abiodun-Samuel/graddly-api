import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { OrganisationRole } from '../organisation-role.enum.js';

import { Organisation } from './organisation.entity.js';

@Entity('organisation_memberships')
@Index(
  'UQ_organisation_memberships_active_user_org',
  ['user', 'organisation'],
  {
    unique: true,
    where: `"isDeleted" = false`,
  },
)
export class OrganisationMembership extends BaseEntity {
  @ManyToOne(() => User, (user) => user.memberships, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Organisation, (org) => org.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({
    type: 'enum',
    enum: OrganisationRole,
    enumName: 'organisation_role',
  })
  role!: OrganisationRole;
}
