import { ApiProperty } from '@nestjs/swagger';

import { ReviewResponseDto } from './review-response.dto.js';

export class BulkScheduleReviewFailureDto {
  @ApiProperty()
  index!: number;

  @ApiProperty()
  reasonCode!: string;

  @ApiProperty()
  message!: string;
}

export class BulkScheduleReviewsResponseDto {
  @ApiProperty()
  processed!: number;

  @ApiProperty()
  succeeded!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ type: [ReviewResponseDto] })
  reviews!: ReviewResponseDto[];

  @ApiProperty({ type: [BulkScheduleReviewFailureDto] })
  failures!: BulkScheduleReviewFailureDto[];
}
