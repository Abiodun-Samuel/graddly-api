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
import { PdfGenerationJob } from '../../pdf/entities/pdf-generation-job.entity.js';
import { User } from '../../users/entities/user.entity.js';
import { SignatureRecordStatus } from '../enums/signature-record-status.enum.js';

@Entity('signature_records')
@Index('IDX_signature_records_org_created', ['organisationId', 'createdAt'])
export class SignatureRecord {
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
  signerUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'signerUserId' })
  signer!: User;

  @Column({ type: 'varchar', length: 1024 })
  signatureImageKey!: string;

  @Column({ type: 'varchar', length: 64 })
  signatureImageHash!: string;

  @Column({ type: 'timestamptz' })
  signedAt!: Date;

  @Column({ type: 'varchar', length: 45 })
  clientIp!: string;

  @Column({ type: 'text', nullable: true })
  userAgent!: string | null;

  @Column({ type: 'uuid', nullable: true })
  pdfGenerationJobId!: string | null;

  @ManyToOne(() => PdfGenerationJob, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'pdfGenerationJobId' })
  pdfGenerationJob!: PdfGenerationJob | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  sourcePdfKey!: string | null;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  signedPdfKey!: string | null;

  @Column({
    type: 'enum',
    enum: SignatureRecordStatus,
    enumName: 'signature_record_status',
    default: SignatureRecordStatus.PENDING,
  })
  status!: SignatureRecordStatus;
}
