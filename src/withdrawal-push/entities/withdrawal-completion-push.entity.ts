import { Column, Entity, Index } from 'typeorm';

import { BaseEntity } from '../../common/entities/base.entity.js';
import { WithdrawalPushStatus } from '../enums/withdrawal-push-status.enum.js';

@Entity('withdrawal_completion_pushes')
@Index('IDX_withdrawal_push_org_status_created', [
  'organisationId',
  'status',
  'createdAt',
])
export class WithdrawalCompletionPush extends BaseEntity {
  @Column({ type: 'uuid' })
  organisationId!: string;

  @Column({ type: 'uuid', nullable: true })
  enrolmentId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  apprenticeId!: string | null;

  @Column({
    type: 'enum',
    enum: WithdrawalPushStatus,
    enumName: 'withdrawal_push_status',
    default: WithdrawalPushStatus.QUEUED,
  })
  status!: WithdrawalPushStatus;

  @Column({ type: 'int', default: 0 })
  attempts!: number;

  @Column({ type: 'text', nullable: true })
  lastError!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  nextRetryAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  deliveredAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  manualRetryRequestedAt!: Date | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;
}
