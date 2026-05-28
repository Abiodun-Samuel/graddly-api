import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ActiveOrganisationGuard } from '../auth/guards/active-organisation.guard.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ORGANISATION_ID_HEADER } from '../common/constants/organisation-headers.js';
import { setCurrentUserId } from '../common/context/correlation-id-context.js';
import { ErrorResponseDto } from '../common/dto/error-response.dto.js';
import { PaginationMetaDto } from '../common/dto/pagination-meta.dto.js';
import { ResponseMessage } from '../common/interceptors/response-message.decorator.js';
import { PaginatedResult } from '../common/pagination/paginated-result.js';
import { setLastKnownUserIdForGuc } from '../database/apply-tenant-gucs.js';

import { BulkOtjActionResponseDto } from './dto/bulk-otj-action-response.dto.js';
import { BulkOtjActionDto } from './dto/bulk-otj-action.dto.js';
import { CreateOtjLogEntryDto } from './dto/create-otj-log-entry.dto.js';
import { ListOtjLogEntriesQueryDto } from './dto/list-otj-log-entries-query.dto.js';
import { OtjLogEntryResponseDto } from './dto/otj-log-entry-response.dto.js';
import { UpdateOtjLogEntryDto } from './dto/update-otj-log-entry.dto.js';
import { OtjLogEntriesService } from './otj-log-entries.service.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@ApiTags('OTJ Log Entries')
@ApiExtraModels(
  OtjLogEntryResponseDto,
  PaginationMetaDto,
  BulkOtjActionResponseDto,
)
@Controller({ path: 'otj-log-entries', version: '1' })
@UseGuards(JwtAuthGuard, ActiveOrganisationGuard)
@ApiBearerAuth()
@ApiHeader({
  name: ORGANISATION_ID_HEADER,
  description: 'Active organisation UUID (optional override)',
  required: false,
})
@ApiUnauthorizedResponse({
  description: 'Missing or invalid bearer token',
  type: ErrorResponseDto,
})
@ApiForbiddenResponse({
  description: 'No active organisation context',
  type: ErrorResponseDto,
})
export class OtjLogEntriesController {
  constructor(private readonly service: OtjLogEntriesService) {}

  @Post()
  @ResponseMessage('OTJ log entry created successfully')
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateOtjLogEntryDto,
  ): Promise<OtjLogEntryResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.create(user, dto);
  }

  @Get()
  @ResponseMessage('OTJ log entries retrieved successfully')
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(OtjLogEntryResponseDto) },
        },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListOtjLogEntriesQueryDto,
  ): Promise<PaginatedResult<OtjLogEntryResponseDto>> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.findAll(user, query);
  }

  @Post('bulk-approve')
  @ResponseMessage('Bulk OTJ approval completed')
  @ApiOperation({ summary: 'Bulk approve OTJ submitted entries' })
  bulkApprove(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkOtjActionDto,
  ): Promise<BulkOtjActionResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.bulkApprove(user, dto.ids);
  }

  @Post('bulk-reject')
  @ResponseMessage('Bulk OTJ rejection completed')
  @ApiOperation({ summary: 'Bulk reject OTJ submitted entries' })
  bulkReject(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkOtjActionDto,
  ): Promise<BulkOtjActionResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.bulkReject(user, dto.ids, dto.reason);
  }

  @Get(':id')
  @ResponseMessage('OTJ log entry retrieved successfully')
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OtjLogEntryResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  @ResponseMessage('OTJ log entry updated successfully')
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOtjLogEntryDto,
  ): Promise<OtjLogEntryResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'OTJ log entry deleted' })
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    await this.service.remove(user, id);
  }
}
