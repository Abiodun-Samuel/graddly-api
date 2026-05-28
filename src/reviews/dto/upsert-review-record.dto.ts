import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested } from 'class-validator';

import { ReviewRecordPayloadDto } from './review-record-payload.dto.js';

export class UpsertReviewRecordDto {
  @ApiProperty({ type: ReviewRecordPayloadDto })
  @ValidateNested()
  @Type(() => ReviewRecordPayloadDto)
  payload!: ReviewRecordPayloadDto;
}
