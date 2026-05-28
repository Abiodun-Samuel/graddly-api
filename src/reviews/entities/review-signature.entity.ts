import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { ReviewSignatureStatus } from '../enums/review-signature-status.enum.js';
import { ReviewSignerParty } from '../enums/review-signer-party.enum.js';

import { Review } from './review.entity.js';

@Entity('review_signatures')
@Index('IDX_review_signatures_org_review', ['organisationId', 'reviewId'])
export class ReviewSignature {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'uuid' })
  reviewId!: string;

  @ManyToOne(() => Review, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewId' })
  review!: Review;

  @Column({
    type: 'enum',
    enum: ReviewSignerParty,
    enumName: 'review_signer_party',
  })
  party!: ReviewSignerParty;

  @Column({ type: 'int' })
  signOrder!: number;

  @Column({ type: 'uuid' })
  signerUserId!: string;

  @Column({
    type: 'enum',
    enum: ReviewSignatureStatus,
    enumName: 'review_signature_status',
    default: ReviewSignatureStatus.PENDING,
  })
  status!: ReviewSignatureStatus;

  @Column({ type: 'uuid', nullable: true })
  signatureRecordId!: string | null;
}
