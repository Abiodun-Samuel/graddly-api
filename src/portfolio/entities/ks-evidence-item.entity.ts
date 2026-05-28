import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Apprentice } from '../../apprentices/entities/apprentice.entity.js';
import { BaseEntity } from '../../common/entities/base.entity.js';
import { Enrolment } from '../../enrolments/entities/enrolment.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { KsEvidenceStatus } from '../enums/ks-evidence-status.enum.js';
import { KsEvidenceType } from '../enums/ks-evidence-type.enum.js';

@Entity('ks_evidence_items')
@Index('IDX_ks_evidence_items_org_enrolment_status', [
  'organisationId',
  'enrolmentId',
  'status',
])
@Index('IDX_ks_evidence_items_org_apprentice', [
  'organisationId',
  'apprenticeId',
])
export class KsEvidenceItem extends BaseEntity {
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

  @Column({
    type: 'enum',
    enum: KsEvidenceType,
    enumName: 'ks_evidence_type',
  })
  type!: KsEvidenceType;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  body!: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  storageKey!: string | null;

  @Column({ type: 'varchar', length: 2048, nullable: true })
  externalUrl!: string | null;

  @Column({
    type: 'enum',
    enum: KsEvidenceStatus,
    enumName: 'ks_evidence_status',
    default: KsEvidenceStatus.DRAFT,
  })
  status!: KsEvidenceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  submittedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  submittedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  reviewedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  acceptedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  acceptedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  returnedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  returnedByUserId!: string | null;

  @Column({ type: 'text', nullable: true })
  returnReason!: string | null;
}
