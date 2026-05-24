import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiExtraModels,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';

import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { PaginationMetaDto } from '../common/dto/pagination-meta.dto.js';
import { PaginationQueryDto } from '../common/dto/pagination-query.dto.js';
import { ResponseMessage } from '../common/interceptors/response-message.decorator.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';

import { BullmqJobInspectionService } from './bullmq-job-inspection.service.js';
import { FailedJobSummaryDto } from './dto/failed-job-summary.dto.js';
import { QueueJobDetailDto } from './dto/queue-job-detail.dto.js';
import { QueueSummaryDto } from './dto/queue-summary.dto.js';
import { QueueOpsApiKeyGuard } from './queue-ops-api-key.guard.js';

@ApiTags('queue-ops')
@ApiExtraModels(
  QueueSummaryDto,
  FailedJobSummaryDto,
  QueueJobDetailDto,
  PaginationMetaDto,
)
@Controller('ops/queues')
@UseGuards(QueueOpsApiKeyGuard)
@SkipThrottle()
@ApiHeader({
  name: 'X-Queue-Ops-Api-Key',
  description: 'Shared secret for internal queue operations',
  required: true,
})
@ApiUnauthorizedResponse({
  description: 'Missing or invalid ops API key',
  type: ErrorResponseDto,
})
export class BullmqOpsController {
  constructor(private readonly inspection: BullmqJobInspectionService) {}

  @Get()
  @ResponseMessage('Queue summaries retrieved successfully')
  @ApiOperation({ summary: 'List BullMQ queues with job counts' })
  @ApiOkResponse({
    description: 'Queue summaries',
    schema: {
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(QueueSummaryDto) },
        },
      },
    },
  })
  listQueues(): Promise<QueueSummaryDto[]> {
    return this.inspection.listQueues();
  }

  @Get(':queueName/jobs/failed')
  @ResponseMessage('Failed jobs retrieved successfully')
  @ApiOperation({ summary: 'List failed jobs for a queue (paginated)' })
  @ApiOkResponse({
    description: 'Paginated failed jobs',
    schema: {
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(FailedJobSummaryDto) },
        },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  listFailedJobs(
    @Param('queueName') queueName: string,
    @Query() query: PaginationQueryDto,
  ): Promise<PaginatedResult<FailedJobSummaryDto>> {
    return this.inspection.listFailedJobs(queueName, query.page, query.perPage);
  }

  @Get(':queueName/jobs/:jobId')
  @ResponseMessage('Queue job retrieved successfully')
  @ApiOperation({
    summary: 'Get job detail (includes payload; may contain sensitive data)',
  })
  @ApiOkResponse({
    description: 'Job detail',
    schema: {
      properties: {
        message: { type: 'string' },
        data: { $ref: getSchemaPath(QueueJobDetailDto) },
      },
    },
  })
  getJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<QueueJobDetailDto> {
    return this.inspection.getJob(queueName, jobId);
  }

  @Post(':queueName/jobs/:jobId/retry')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Job queued for retry')
  @ApiOperation({ summary: 'Retry a failed job' })
  @ApiNoContentResponse({ description: 'Job moved back to the wait queue' })
  async retryJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<void> {
    await this.inspection.retryJob(queueName, jobId);
  }

  @Delete(':queueName/jobs/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('Job removed successfully')
  @ApiOperation({ summary: 'Remove a job from the queue' })
  @ApiNoContentResponse({ description: 'Job removed from Redis' })
  async removeJob(
    @Param('queueName') queueName: string,
    @Param('jobId') jobId: string,
  ): Promise<void> {
    await this.inspection.removeJob(queueName, jobId);
  }
}
