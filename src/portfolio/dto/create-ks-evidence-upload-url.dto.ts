import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsString, IsUUID, Max, MaxLength, Min } from 'class-validator';

import { MAX_FILE_SIZE_BYTES } from '../../storage/storage.constants.js';

export class CreateKsEvidenceUploadUrlDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  apprenticeId!: string;

  @ApiProperty({ example: 'evidence.pdf', maxLength: 255 })
  @IsString()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @MaxLength(255)
  contentType!: string;

  @ApiProperty({ minimum: 1, maximum: MAX_FILE_SIZE_BYTES })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  contentLength!: number;
}
