import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';

import { ReviewSignerParty } from '../enums/review-signer-party.enum.js';

export class SignReviewDto {
  @ApiProperty({ enum: ReviewSignerParty })
  @IsEnum(ReviewSignerParty)
  party!: ReviewSignerParty;

  @ApiProperty({
    example: 'orgs/uuid/signature/obj/signature.png',
  })
  @IsString()
  @MaxLength(1024)
  signatureImageKey!: string;
}
