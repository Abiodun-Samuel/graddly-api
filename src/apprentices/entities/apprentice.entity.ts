import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { Organisation } from '../../organisations/entities/organisation.entity.js';
import { ApprenticeStatus } from '../enums/apprentice-status.enum.js';

import type { Enrolment } from '../../enrolments/entities/enrolment.entity.js';

@Entity('apprentices')
@Index('UQ_apprentices_active_org_email', ['organisationId', 'email'], {
  unique: true,
  where: `"isDeleted" = false`,
})
export class Apprentice extends BaseEntity {
  @Column({ type: 'uuid' })
  organisationId!: string;

  @ManyToOne(() => Organisation, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'organisationId' })
  organisation!: Organisation;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({ type: 'varchar', length: 320 })
  email!: string;

  @Column({
    type: 'enum',
    enum: ApprenticeStatus,
    enumName: 'apprentice_status',
    default: ApprenticeStatus.PENDING,
  })
  status!: ApprenticeStatus;

  @OneToMany('Enrolment', 'apprentice')
  enrolments!: Enrolment[];
}
