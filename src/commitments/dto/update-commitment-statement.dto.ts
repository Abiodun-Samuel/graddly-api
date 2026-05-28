import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsUUID, ValidateNested } from 'class-validator';

import { CommitmentStatementContentDto } from './commitment-statement-content.dto.js';

export class UpdateCommitmentStatementDto {
  @ApiPropertyOptional({ type: CommitmentStatementContentDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => CommitmentStatementContentDto)
  content?: CommitmentStatementContentDto;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  apprenticeUserId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  tutorUserId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  employerManagerUserId?: string;
}
