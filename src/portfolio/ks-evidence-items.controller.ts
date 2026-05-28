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
  ApiCreatedResponse,
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
import { PresignedUploadResponseDto } from '../storage/dto/create-presigned-upload.dto.js';

import { CreateKsEvidenceItemDto } from './dto/create-ks-evidence-item.dto.js';
import { CreateKsEvidenceUploadUrlDto } from './dto/create-ks-evidence-upload-url.dto.js';
import { KsEvidenceItemResponseDto } from './dto/ks-evidence-item-response.dto.js';
import { ListKsEvidenceItemsQueryDto } from './dto/list-ks-evidence-items-query.dto.js';
import { ReturnKsEvidenceItemDto } from './dto/return-ks-evidence-item.dto.js';
import { UpdateKsEvidenceItemDto } from './dto/update-ks-evidence-item.dto.js';
import { KsEvidenceItemsService } from './ks-evidence-items.service.js';

import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface.js';

@ApiTags('KSB Evidence')
@ApiExtraModels(
  KsEvidenceItemResponseDto,
  PresignedUploadResponseDto,
  PaginationMetaDto,
)
@Controller({ path: 'ksb-evidence-items', version: '1' })
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
export class KsEvidenceItemsController {
  constructor(private readonly service: KsEvidenceItemsService) {}

  @Post('upload-url')
  @ResponseMessage('Evidence upload URL created successfully')
  @ApiOperation({
    summary: 'Create presigned upload URL for file evidence',
  })
  @ApiCreatedResponse({ type: PresignedUploadResponseDto })
  createUploadUrl(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateKsEvidenceUploadUrlDto,
  ): Promise<PresignedUploadResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.createUploadUrl(user, dto);
  }

  @Post()
  @ResponseMessage('KSB evidence item created successfully')
  @ApiOperation({ summary: 'Create draft KSB evidence' })
  @ApiCreatedResponse({ type: KsEvidenceItemResponseDto })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateKsEvidenceItemDto,
  ): Promise<KsEvidenceItemResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.create(user, dto);
  }

  @Get()
  @ResponseMessage('KSB evidence items retrieved successfully')
  @ApiOperation({ summary: 'List KSB evidence items' })
  @ApiOkResponse({
    schema: {
      properties: {
        message: { type: 'string' },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(KsEvidenceItemResponseDto) },
        },
        meta: { $ref: getSchemaPath(PaginationMetaDto) },
      },
    },
  })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListKsEvidenceItemsQueryDto,
  ): Promise<PaginatedResult<KsEvidenceItemResponseDto>> {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ResponseMessage('KSB evidence item retrieved successfully')
  @ApiOperation({ summary: 'Get KSB evidence item by id' })
  @ApiOkResponse({ type: KsEvidenceItemResponseDto })
  findOne(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<KsEvidenceItemResponseDto> {
    return this.service.findOne(user, id);
  }

  @Patch(':id')
  @ResponseMessage('KSB evidence item updated successfully')
  @ApiOperation({ summary: 'Update draft KSB evidence' })
  @ApiOkResponse({ type: KsEvidenceItemResponseDto })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateKsEvidenceItemDto,
  ): Promise<KsEvidenceItemResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.update(user, id, dto);
  }

  @Post(':id/submit')
  @ResponseMessage('KSB evidence submitted successfully')
  @ApiOperation({ summary: 'Submit draft evidence for review' })
  @ApiCreatedResponse({ type: KsEvidenceItemResponseDto })
  submit(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<KsEvidenceItemResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.submit(user, id);
  }

  @Post(':id/review')
  @ResponseMessage('KSB evidence marked as reviewed')
  @ApiOperation({
    summary: 'Mark submitted evidence as reviewed (tutor/admin)',
  })
  @ApiCreatedResponse({ type: KsEvidenceItemResponseDto })
  review(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<KsEvidenceItemResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.review(user, id);
  }

  @Post(':id/accept')
  @ResponseMessage('KSB evidence accepted successfully')
  @ApiOperation({ summary: 'Accept reviewed evidence (tutor/admin)' })
  @ApiCreatedResponse({ type: KsEvidenceItemResponseDto })
  accept(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<KsEvidenceItemResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.accept(user, id);
  }

  @Post(':id/return')
  @ResponseMessage('KSB evidence returned to draft')
  @ApiOperation({
    summary: 'Return evidence to draft with reason (tutor/admin)',
  })
  @ApiCreatedResponse({ type: KsEvidenceItemResponseDto })
  returnToDraft(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReturnKsEvidenceItemDto,
  ): Promise<KsEvidenceItemResponseDto> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    return this.service.returnToDraft(user, id, dto.reason);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ResponseMessage('KSB evidence item deleted successfully')
  @ApiOperation({ summary: 'Soft-delete draft evidence' })
  @ApiNoContentResponse()
  async remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<void> {
    setCurrentUserId(user.id);
    setLastKnownUserIdForGuc(user.id);
    await this.service.remove(user, id);
  }
}
