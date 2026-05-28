import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';

import { OtjLogStatus } from '../enums/otj-log-status.enum.js';

import { CreateOtjLogEntryDto } from './create-otj-log-entry.dto.js';

export class UpdateOtjLogEntryDto extends PartialType(CreateOtjLogEntryDto) {
  @ApiPropertyOptional({ enum: OtjLogStatus })
  @IsOptional()
  @IsEnum(OtjLogStatus)
  status?: OtjLogStatus;
}
