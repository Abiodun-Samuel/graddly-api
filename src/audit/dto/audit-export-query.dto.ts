import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { AuditAction } from '../enums/audit-action.enum.js';
import { AuditExportFormat } from '../enums/audit-export-format.enum.js';

export class AuditExportQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({
    enum: AuditExportFormat,
    default: AuditExportFormat.JSON,
  })
  @IsOptional()
  @IsEnum(AuditExportFormat)
  format: AuditExportFormat = AuditExportFormat.JSON;

  @ApiPropertyOptional({ example: 'invitations' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  entityType?: string;

  @ApiPropertyOptional({ enum: AuditAction })
  @IsOptional()
  @IsEnum(AuditAction)
  action?: AuditAction;

  @ApiPropertyOptional({ example: '2026-01-01T00:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ example: '2026-12-31T23:59:59.999Z' })
  @IsOptional()
  @IsDateString()
  to?: string;
}

export class AuditLogEntryDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty({ format: 'uuid', nullable: true })
  actorUserId!: string | null;

  @ApiProperty({ format: 'uuid', nullable: true })
  organisationId!: string | null;

  @ApiProperty()
  entityType!: string;

  @ApiProperty({ format: 'uuid' })
  entityId!: string;

  @ApiProperty({ enum: AuditAction })
  action!: AuditAction;

  @ApiProperty({ type: 'object', additionalProperties: true })
  changes!: Record<string, { from?: unknown; to?: unknown }>;
}
