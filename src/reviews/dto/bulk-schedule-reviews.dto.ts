import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayNotEmpty, IsArray, ValidateNested } from 'class-validator';

import { CreateReviewDto } from './create-review.dto.js';

export class BulkScheduleReviewsDto {
  @ApiProperty({
    type: [CreateReviewDto],
    description: 'Reviews to schedule (max 20 per request)',
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateReviewDto)
  items!: CreateReviewDto[];
}
