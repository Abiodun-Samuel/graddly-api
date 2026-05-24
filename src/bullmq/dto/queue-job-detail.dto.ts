import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { FailedJobSummaryDto } from './failed-job-summary.dto.js';

export class QueueJobDetailDto extends FailedJobSummaryDto {
  @ApiProperty({
    description: 'Job payload (may contain PII for some queues)',
    example: { userId: 'uuid' },
  })
  data!: unknown;

  @ApiPropertyOptional({
    type: 'array',
    items: { type: 'string' },
    description: 'Stack traces from failed attempts',
  })
  stacktrace?: string[] | null;

  @ApiPropertyOptional({
    description: 'Job options as stored in Redis',
    example: { attempts: 3 },
  })
  opts?: Record<string, unknown>;
}
