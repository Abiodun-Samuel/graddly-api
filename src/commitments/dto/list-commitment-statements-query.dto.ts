import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsUUID } from 'class-validator';

import { PaginationQueryDto } from '../../common/dto/pagination-query.dto.js';
import { CommitmentStatementStatus } from '../enums/commitment-statement-status.enum.js';

export class ListCommitmentStatementsQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  enrolmentId?: string;

  @ApiPropertyOptional({ enum: CommitmentStatementStatus })
  @IsOptional()
  @IsEnum(CommitmentStatementStatus)
  status?: CommitmentStatementStatus;
}
