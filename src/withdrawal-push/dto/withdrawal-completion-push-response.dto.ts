import { ApiProperty } from '@nestjs/swagger';

import { WithdrawalPushStatus } from '../enums/withdrawal-push-status.enum.js';

export class WithdrawalCompletionPushResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  enrolmentId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  apprenticeId!: string | null;

  @ApiProperty({ enum: WithdrawalPushStatus })
  status!: WithdrawalPushStatus;

  @ApiProperty()
  attempts!: number;

  @ApiProperty({ nullable: true })
  lastError!: string | null;

  @ApiProperty({ nullable: true })
  deliveredAt!: string | null;
}
