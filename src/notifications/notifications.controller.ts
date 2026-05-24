import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { setCurrentUserId } from '../common/context/correlation-id-context.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { PaginationMetaDto } from '../common/dto/pagination-meta.dto.js';
import { ResponseMessage } from '../common/interceptors/response-message.decorator.js';
import { setLastKnownUserIdForGuc } from '../database/apply-tenant-gucs.js';

import { ListNotificationsQueryDto } from './dto/list-notifications-query.dto.js';
import { MarkAllNotificationsReadDto } from './dto/mark-all-notifications-read.dto.js';
import { NotificationResponseDto } from './dto/notification-response.dto.js';
import { NotificationsService } from './notifications.service.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';
import type { PaginatedResult } from '../common/pagination/paginated-result.js';

@ApiTags('Notifications')
@ApiExtraModels(NotificationResponseDto, PaginationMetaDto)
@Controller({ path: 'notifications', version: '1' })
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token',
  type: ErrorResponseDto,
})
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ResponseMessage('Notifications retrieved successfully')
  @ApiOperation({ summary: 'List notifications for the current user' })
  @ApiOkResponse({
    description: 'Paginated notifications',
    schema: {
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(NotificationResponseDto) },
        },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListNotificationsQueryDto,
  ): Promise<PaginatedResult<NotificationResponseDto>> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.notificationsService.listForUser(
      user.id,
      query,
      user.organisationId,
    );
  }

  @Patch('read-all')
  @ResponseMessage('Notifications marked as read')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  @ApiOkResponse({
    description: 'Count of notifications updated',
    schema: {
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: { updated: { type: 'number' } },
        },
      },
    },
  })
  markAllRead(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: MarkAllNotificationsReadDto,
  ): Promise<{ updated: number }> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.notificationsService.markAllRead(
      user.id,
      dto.organisationId ?? user.organisationId ?? undefined,
    );
  }

  @Patch(':id/read')
  @ResponseMessage('Notification marked as read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiOkResponse({
    description: 'Updated notification',
    schema: {
      properties: {
        message: { type: 'string' },
        data: { $ref: getSchemaPath(NotificationResponseDto) },
      },
    },
  })
  markRead(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<NotificationResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.notificationsService.markRead(user.id, id);
  }
}
