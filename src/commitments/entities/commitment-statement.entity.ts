import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { CommitmentStatementStatus } from '../enums/commitment-statement-status.enum.js';

import { CommitmentStatementGroup } from './commitment-statement-group.entity.js';

@Entity('commitment_statements')
@Index('UQ_commitment_statements_group_version', ['groupId', 'version'], {
  unique: true,
})
@Index('IDX_commitment_statements_org_status', ['organisationId', 'status'])
export class CommitmentStatement {
  @Column({ type: 'uuid', primary: true, generated: 'uuid' })
  id!: string;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  createdAt!: Date;

  @Column({ type: 'timestamptz', default: () => 'now()' })
  updatedAt!: Date;

  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'uuid' })
  groupId!: string;

  @ManyToOne(() => CommitmentStatementGroup, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'groupId' })
  group!: CommitmentStatementGroup;

  @Column({ type: 'int' })
  version!: number;

  @Column({
    type: 'enum',
    enum: CommitmentStatementStatus,
    enumName: 'commitment_statement_status',
    default: CommitmentStatementStatus.DRAFT,
  })
  status!: CommitmentStatementStatus;

  @Column({ type: 'jsonb' })
  content!: Record<string, unknown>;

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

  @Column({ type: 'timestamptz', nullable: true })
  publishedAt!: Date | null;

  @Column({ type: 'uuid', nullable: true })
  publishedByUserId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  supersededAt!: Date | null;
}
