import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { KsEvidenceStatus } from '../enums/ks-evidence-status.enum.js';

export class ListKsEvidenceItemsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  enrolmentId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  apprenticeId?: string;

  @ApiPropertyOptional({ enum: KsEvidenceStatus })
  @IsOptional()
  @IsEnum(KsEvidenceStatus)
  status?: KsEvidenceStatus;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  ksbDefinitionId?: string;
}
