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
import { TripartiteParty } from '../../signing/tripartite-party.enum.js';
import { CommitmentSignatureStatus } from '../enums/commitment-signature-status.enum.js';

import { CommitmentStatement } from './commitment-statement.entity.js';

@Entity('commitment_signatures')
@Index('IDX_commitment_signatures_org_statement', [
  'organisationId',
  'statementId',
])
export class CommitmentSignature {
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
  statementId!: string;

  @ManyToOne(() => CommitmentStatement, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'statementId' })
  statement!: CommitmentStatement;

  @Column({
    type: 'enum',
    enum: TripartiteParty,
    enumName: 'tripartite_party',
  })
  party!: TripartiteParty;

  @Column({ type: 'int' })
  signOrder!: number;

  @Column({ type: 'uuid' })
  signerUserId!: string;

  @Column({
    type: 'enum',
    enum: CommitmentSignatureStatus,
    enumName: 'commitment_signature_status',
    default: CommitmentSignatureStatus.PENDING,
  })
  status!: CommitmentSignatureStatus;

  @Column({ type: 'uuid', nullable: true })
  signatureRecordId!: string | null;
}
