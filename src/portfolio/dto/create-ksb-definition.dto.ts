import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { KsbKind } from '../enums/ksb-kind.enum.js';

export class CreateKsbDefinitionDto {
  @ApiProperty({ example: 'K1', maxLength: 20 })
  @IsString()
  @MaxLength(20)
  code!: string;

  @ApiProperty({ enum: KsbKind })
  @IsEnum(KsbKind)
  kind!: KsbKind;

  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
