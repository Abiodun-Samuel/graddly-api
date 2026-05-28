import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class BulkOtjActionDto {
  @ApiProperty({ type: [String], format: 'uuid' })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('4', { each: true })
  ids!: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reason?: string;
}
