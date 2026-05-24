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
import { User } from '../../users/entities/user.entity.js';
import { PdfJobStatus } from '../enums/pdf-job-status.enum.js';
import { PdfJobTemplate } from '../enums/pdf-job-template.enum.js';

@Entity('pdf_generation_jobs')
@Index('IDX_pdf_jobs_org_created', ['organisationId', 'createdAt'])
export class PdfGenerationJob {
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
  requestedByUserId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'requestedByUserId' })
  requestedBy!: User;

  @Column({
    type: 'enum',
    enum: PdfJobTemplate,
    enumName: 'pdf_job_template',
  })
  template!: PdfJobTemplate;

  @Column({
    type: 'enum',
    enum: PdfJobStatus,
    enumName: 'pdf_job_status',
    default: PdfJobStatus.QUEUED,
  })
  status!: PdfJobStatus;

  @Column({ type: 'varchar', length: 1024, nullable: true })
  outputKey!: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;
}
