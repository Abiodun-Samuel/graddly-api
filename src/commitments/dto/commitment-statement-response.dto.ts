import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { CommitmentStatementStatus } from '../enums/commitment-statement-status.enum.js';

import { CommitmentStatementContentDto } from './commitment-statement-content.dto.js';

export class CommitmentStatementResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  groupId!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  apprenticeId!: string;

  @ApiProperty()
  version!: number;

  @ApiProperty({ enum: CommitmentStatementStatus })
  status!: CommitmentStatementStatus;

  @ApiProperty({ type: CommitmentStatementContentDto })
  content!: CommitmentStatementContentDto;

  @ApiProperty({ format: 'uuid' })
  apprenticeUserId!: string;

  @ApiProperty({ format: 'uuid' })
  tutorUserId!: string;

  @ApiProperty({ format: 'uuid' })
  employerManagerUserId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  snapshotPdfJobId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  finalSignedPdfKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  publishedAt!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  publishedByUserId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  supersededAt!: string | null;
}
