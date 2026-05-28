import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { Standard } from '../../programmes/entities/standard.entity.js';
import { KsbKind } from '../enums/ksb-kind.enum.js';

@Entity('ksb_definitions')
@Index('UQ_ksb_definitions_active_standard_code', ['standardId', 'code'], {
  unique: true,
  where: `"isDeleted" = false`,
})
@Index('IDX_ksb_definitions_org_standard', ['organisationId', 'standardId'])
export class KsbDefinition extends BaseEntity {
  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'uuid' })
  standardId!: string;

  @ManyToOne(() => Standard, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'standardId' })
  standard!: Standard;

  @Column({ type: 'varchar', length: 20 })
  code!: string;

  @Column({
    type: 'enum',
    enum: KsbKind,
    enumName: 'ksb_kind',
  })
  kind!: KsbKind;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'int', default: 0 })
  sortOrder!: number;
}
