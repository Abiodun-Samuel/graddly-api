import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { OrganisationRole } from '../../organisations/organisation-role.enum.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('invitations')
export class Invitation extends BaseEntity {
  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({
    type: 'enum',
    enum: OrganisationRole,
    enumName: 'organisation_role',
  })
  role!: OrganisationRole;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invitedByUserId' })
  invitedBy!: User | null;
}
