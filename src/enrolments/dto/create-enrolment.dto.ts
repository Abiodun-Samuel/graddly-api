import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateEnrolmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  apprenticeId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  standardId!: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  agreedPrice?: number;

  @ApiProperty({ required: false, format: 'date' })
  @IsOptional()
  @IsDateString()
  plannedStartDate?: string;

  @ApiProperty({ required: false, format: 'date' })
  @IsOptional()
  @IsDateString()
  plannedEndDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  completionPaymentPercent?: number;
}
