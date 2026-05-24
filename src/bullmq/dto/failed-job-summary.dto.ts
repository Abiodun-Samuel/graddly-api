import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FailedJobSummaryDto {
  @ApiProperty({ example: '42' })
  id!: string;

  @ApiProperty({ example: 'send-email' })
  name!: string;

  @ApiProperty({ example: 3 })
  attemptsMade!: number;

  @ApiPropertyOptional({ example: 'Connection timeout' })
  failedReason?: string;

  @ApiProperty({ example: 1716566400000 })
  timestamp!: number;

  @ApiPropertyOptional({ example: 1716566405000 })
  finishedOn?: number;
}
