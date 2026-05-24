import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { StorageObjectCategory } from '../enums/storage-object-category.enum.js';
import { MAX_FILE_SIZE_BYTES } from '../storage.constants.js';

export class CreatePresignedUploadDto {
  @ApiProperty({ example: 'evidence.pdf', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  filename!: string;

  @ApiProperty({ example: 'application/pdf' })
  @IsString()
  @IsNotEmpty()
  contentType!: string;

  @ApiProperty({
    example: 1_048_576,
    description: 'Declared file size in bytes (max 25 MB)',
  })
  @IsInt()
  @Min(1)
  @Max(MAX_FILE_SIZE_BYTES)
  contentLength!: number;

  @ApiProperty({
    enum: StorageObjectCategory,
    example: StorageObjectCategory.EVIDENCE,
  })
  @IsEnum(StorageObjectCategory)
  category!: StorageObjectCategory;

  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Optional learner scope for the object key',
  })
  @IsOptional()
  @IsUUID()
  learnerId?: string;
}

export class PresignedUploadResponseDto {
  @ApiProperty({ example: 'orgs/uuid/learners/uuid/evidence/uuid/file.pdf' })
  key!: string;

  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/...' })
  uploadUrl!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}
