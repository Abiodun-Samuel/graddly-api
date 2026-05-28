import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Apprentice } from '../../apprentices/entities/apprentice.entity.js';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { Standard } from '../../programmes/entities/standard.entity.js';
import { EnrolmentStatus } from '../enums/enrolment-status.enum.js';

@Entity('enrolments')
@Index(
  'UQ_enrolments_active_org_apprentice_standard',
  ['organisationId', 'apprenticeId', 'standardId'],
  {
    unique: true,
    where: `"isDeleted" = false AND "status" IN ('draft', 'active')`,
  },
)
export class Enrolment extends BaseEntity {
  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'uuid' })
  apprenticeId!: string;

  @ManyToOne(() => Apprentice, (apprentice) => apprentice.enrolments, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'apprenticeId' })
  apprentice!: Apprentice;

  @Column({ type: 'uuid' })
  standardId!: string;

  @ManyToOne(() => Standard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standardId' })
  standard!: Standard;

  @Column({
    type: 'enum',
    enum: EnrolmentStatus,
    enumName: 'enrolment_status',
    default: EnrolmentStatus.DRAFT,
  })
  status!: EnrolmentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  activatedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;
}
