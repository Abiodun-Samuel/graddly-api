import { Column, Entity, OneToMany } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';

import type { OrganisationMembership } from './organisation-membership.entity.js';

@Entity('organisations')
export class Organisation extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;

  @OneToMany('OrganisationMembership', 'organisation')
  memberships!: OrganisationMembership[];
}
