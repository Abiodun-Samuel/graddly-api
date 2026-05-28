import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsUUID, ValidateNested } from 'class-validator';

import { CommitmentStatementContentDto } from './commitment-statement-content.dto.js';

export class CreateCommitmentStatementDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  apprenticeId!: string;

  @ApiProperty({ type: CommitmentStatementContentDto })
  @ValidateNested()
  @Type(() => CommitmentStatementContentDto)
  content!: CommitmentStatementContentDto;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  apprenticeUserId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  tutorUserId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  employerManagerUserId!: string;
}
