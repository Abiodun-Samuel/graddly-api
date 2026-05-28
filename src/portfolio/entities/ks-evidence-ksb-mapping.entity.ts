import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Organisation } from '../../organisations/entities/organisation.entity.js';

import { KsEvidenceItem } from './ks-evidence-item.entity.js';
import { KsbDefinition } from './ksb-definition.entity.js';

@Entity('ks_evidence_ksb_mappings')
@Index(
  'UQ_ks_evidence_ksb_mappings_item_ksb',
  ['evidenceItemId', 'ksbDefinitionId'],
  {
    unique: true,
  },
)
export class KsEvidenceKsbMapping {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'uuid' })
  evidenceItemId!: string;

  @ManyToOne(() => KsEvidenceItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'evidenceItemId' })
  evidenceItem!: KsEvidenceItem;

  @Column({ type: 'uuid' })
  ksbDefinitionId!: string;

  @ManyToOne(() => KsbDefinition, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ksbDefinitionId' })
  ksbDefinition!: KsbDefinition;
}
