import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ReviewRecordPayloadDto } from './review-record-payload.dto.js';

export class ReviewRecordResponseDto {
  @ApiProperty({ format: 'uuid' })
  reviewId!: string;

  @ApiProperty({ type: ReviewRecordPayloadDto })
  payload!: ReviewRecordPayloadDto;

  @ApiPropertyOptional({ nullable: true })
  submittedAt!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  submittedByUserId!: string | null;
}
