import { ApiProperty } from '@nestjs/swagger';

import { EnrolmentStatus } from '../enums/enrolment-status.enum.js';

export class EnrolmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  apprenticeId!: string;

  @ApiProperty({ format: 'uuid' })
  standardId!: string;

  @ApiProperty({ enum: EnrolmentStatus })
  status!: EnrolmentStatus;

  @ApiProperty({ nullable: true })
  activatedAt!: string | null;

  @ApiProperty({ nullable: true })
  completedAt!: string | null;

  @ApiProperty({ nullable: true })
  cancelledAt!: string | null;

  @ApiProperty({ nullable: true })
  agreedPrice!: number | null;

  @ApiProperty({ nullable: true })
  plannedStartDate!: string | null;

  @ApiProperty({ nullable: true })
  plannedEndDate!: string | null;

  @ApiProperty({ nullable: true })
  plannedDurationMonths!: number | null;

  @ApiProperty({ nullable: true })
  completionPaymentPercent!: number | null;
}
