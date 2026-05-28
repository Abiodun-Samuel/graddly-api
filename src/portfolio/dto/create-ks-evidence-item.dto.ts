import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
} from 'class-validator';

import { KsEvidenceType } from '../enums/ks-evidence-type.enum.js';

export class CreateKsEvidenceItemDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  apprenticeId!: string;

  @ApiProperty({ enum: KsEvidenceType })
  @IsEnum(KsEvidenceType)
  type!: KsEvidenceType;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'S3 object key from presigned upload (file type only)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  storageKey?: string;

  @ApiPropertyOptional({ description: 'External URL (link type only)' })
  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  externalUrl?: string;

  @ApiProperty({
    type: [String],
    description: 'KSB definition IDs to map this evidence to',
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID('4', { each: true })
  ksbDefinitionIds!: string[];
}
