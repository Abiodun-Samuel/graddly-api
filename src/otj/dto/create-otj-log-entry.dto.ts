import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateOtjLogEntryDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  apprenticeId!: string;

  @ApiProperty({ format: 'date' })
  @IsDateString()
  loggedDate!: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  minutes!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  @IsOptional()
  @IsObject()
  evidence?: Record<string, unknown>;
}
