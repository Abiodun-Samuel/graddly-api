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

import { Enrolment } from '../../enrolments/entities/enrolment.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { KsbCoverageAssessment } from '../enums/ksb-coverage-assessment.enum.js';

import { KsbDefinition } from './ksb-definition.entity.js';

@Entity('enrolment_ksb_coverage')
@Index(
  'UQ_enrolment_ksb_coverage_enrolment_ksb',
  ['enrolmentId', 'ksbDefinitionId'],
  { unique: true },
)
export class EnrolmentKsbCoverage {
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
  enrolmentId!: string;

  @ManyToOne(() => Enrolment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'enrolmentId' })
  enrolment!: Enrolment;

  @Column({ type: 'uuid' })
  ksbDefinitionId!: string;

  @ManyToOne(() => KsbDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ksbDefinitionId' })
  ksbDefinition!: KsbDefinition;

  @Column({
    type: 'enum',
    enum: KsbCoverageAssessment,
    enumName: 'ksb_coverage_assessment',
  })
  assessment!: KsbCoverageAssessment;

  @Column({ type: 'uuid' })
  assessedByUserId!: string;

  @Column({ type: 'timestamptz' })
  assessedAt!: Date;
}
