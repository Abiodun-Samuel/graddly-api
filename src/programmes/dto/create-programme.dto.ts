import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';

import { ProgrammeStatus } from '../enums/programme-status.enum.js';

export class CreateProgrammeDto {
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

  @ApiPropertyOptional({ enum: ProgrammeStatus })
  @IsOptional()
  @IsEnum(ProgrammeStatus)
  status?: ProgrammeStatus;
}
