import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Apprentice } from '../../apprentices/entities/apprentice.entity.js';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Enrolment } from '../../enrolments/entities/enrolment.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';

import { CommitmentStatement } from './commitment-statement.entity.js';

@Entity('commitment_statement_groups')
@Index(
  'UQ_commitment_groups_active_org_enrolment',
  ['organisationId', 'enrolmentId'],
  {
    unique: true,
    where: `"isDeleted" = false`,
  },
)
export class CommitmentStatementGroup extends BaseEntity {
  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'uuid' })
  enrolmentId!: string;

  @ManyToOne(() => Enrolment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrolmentId' })
  enrolment!: Enrolment;

  @Column({ type: 'uuid' })
  apprenticeId!: string;

  @ManyToOne(() => Apprentice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'apprenticeId' })
  apprentice!: Apprentice;

  @Column({ type: 'uuid', nullable: true })
  currentVersionId!: string | null;

  @ManyToOne(() => CommitmentStatement, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({ name: 'currentVersionId' })
  currentVersion!: CommitmentStatement | null;
}
