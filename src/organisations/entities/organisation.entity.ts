import { Column, Entity } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';

@Entity('organisations')
export class Organisation extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string;
}
