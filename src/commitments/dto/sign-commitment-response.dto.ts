import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { TripartiteParty } from '../../signing/tripartite-party.enum.js';
import { CommitmentStatementStatus } from '../enums/commitment-statement-status.enum.js';

export class SignCommitmentResponseDto {
  @ApiProperty({ format: 'uuid' })
  statementId!: string;

  @ApiProperty({ enum: TripartiteParty })
  party!: TripartiteParty;

  @ApiProperty({ enum: CommitmentStatementStatus })
  status!: CommitmentStatementStatus;

  @ApiProperty()
  signedPdfKey!: string;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  downloadExpiresAt?: string;

  @ApiPropertyOptional({ enum: TripartiteParty, nullable: true })
  nextParty!: TripartiteParty | null;
}
