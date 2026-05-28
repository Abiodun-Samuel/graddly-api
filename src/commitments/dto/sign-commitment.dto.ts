import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MaxLength } from 'class-validator';

import { TripartiteParty } from '../../signing/tripartite-party.enum.js';

export class SignCommitmentDto {
  @ApiProperty({ enum: TripartiteParty })
  @IsEnum(TripartiteParty)
  party!: TripartiteParty;

  @ApiProperty({
    example: 'orgs/uuid/signature/obj/signature.png',
  })
  @IsString()
  @MaxLength(1024)
  signatureImageKey!: string;
}
