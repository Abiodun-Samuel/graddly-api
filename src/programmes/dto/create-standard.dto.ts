import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

import { StandardStatus } from '../enums/standard-status.enum.js';

export class CreateStandardDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  programmeId!: string;

  @ApiProperty({ maxLength: 100 })
  @IsString()
  @MaxLength(100)
  code!: string;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: StandardStatus })
  @IsOptional()
  @IsEnum(StandardStatus)
  status?: StandardStatus;

  @ApiPropertyOptional({
    description: 'Maximum levy funding band used for forecast calculations',
  })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  fundingBandMax?: number;

  @ApiPropertyOptional({
    description:
      'Default expected duration in months for active spend forecast',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  defaultDurationMonths?: number;
}
