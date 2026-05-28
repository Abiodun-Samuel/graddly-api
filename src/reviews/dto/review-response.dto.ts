import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ReviewStatus } from '../enums/review-status.enum.js';

export class ReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  apprenticeId!: string;

  @ApiProperty()
  scheduledAt!: string;

  @ApiPropertyOptional({ nullable: true })
  title!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewType!: string | null;

  @ApiProperty({ enum: ReviewStatus })
  status!: ReviewStatus;

  @ApiProperty()
  isOverdue!: boolean;

  @ApiPropertyOptional({ nullable: true })
  overdueSince!: string | null;

  @ApiProperty({ description: 'Days until scheduled date (negative if past)' })
  daysUntilDue!: number;

  @ApiProperty({ format: 'uuid' })
  apprenticeUserId!: string;

  @ApiProperty({ format: 'uuid' })
  tutorUserId!: string;

  @ApiProperty({ format: 'uuid' })
  employerManagerUserId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  snapshotPdfJobId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalSignedPdfKey!: string | null;
}
