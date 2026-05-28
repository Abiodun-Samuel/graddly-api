import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ReviewSignerParty } from '../enums/review-signer-party.enum.js';
import { ReviewStatus } from '../enums/review-status.enum.js';

export class SignReviewResponseDto {
  @ApiProperty({ format: 'uuid' })
  reviewId!: string;

  @ApiProperty({ enum: ReviewSignerParty })
  party!: ReviewSignerParty;

  @ApiProperty({ enum: ReviewStatus })
  reviewStatus!: ReviewStatus;

  @ApiPropertyOptional({ nullable: true })
  signedPdfKey!: string | null;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  downloadExpiresAt?: string;

  @ApiProperty()
  nextParty!: ReviewSignerParty | null;
}
