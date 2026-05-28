import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Apprentice } from '../../apprentices/entities/apprentice.entity.js';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Enrolment } from '../../enrolments/entities/enrolment.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { ReviewStatus } from '../enums/review-status.enum.js';

@Entity('reviews')
@Index('IDX_reviews_org_scheduled_at', ['organisationId', 'scheduledAt'])
@Index('IDX_reviews_org_status_scheduled_at', [
  'organisationId',
  'status',
  'scheduledAt',
])
@Index('IDX_reviews_org_apprentice_scheduled_at', [
  'organisationId',
  'apprenticeId',
  'scheduledAt',
])
@Index('IDX_reviews_org_enrolment_scheduled_at', [
  'organisationId',
  'enrolmentId',
  'scheduledAt',
])
export class Review extends BaseEntity {
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

  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'varchar', length: 200, nullable: true })
  title!: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reviewType!: string | null;

  @Column({
    type: 'enum',
    enum: ReviewStatus,
    enumName: 'review_status',
    default: ReviewStatus.SCHEDULED,
  })
  status!: ReviewStatus;

  @Column({ type: 'boolean', default: false })
  isOverdue!: boolean;

  @Column({ type: 'date', nullable: true })
  overdueSince!: string | null;

  @Column({ type: 'uuid' })
  apprenticeUserId!: string;

  @Column({ type: 'uuid' })
  tutorUserId!: string;

  @Column({ type: 'uuid' })
  employerManagerUserId!: string;

  @Column({ type: 'uuid', nullable: true })
  snapshotPdfJobId!: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  finalSignedPdfKey!: string | null;
}
