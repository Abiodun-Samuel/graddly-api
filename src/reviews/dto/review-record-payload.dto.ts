import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class SmartGoalDto {
  @ApiProperty()
  @IsString()
  objective!: string;

  @ApiProperty()
  @IsString()
  measurable!: string;

  @ApiProperty()
  @IsString()
  achievable!: string;

  @ApiProperty()
  @IsString()
  relevant!: string;

  @ApiProperty()
  @IsString()
  timeBound!: string;
}

export class WellbeingDto {
  @ApiPropertyOptional({ minimum: 1, maximum: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  score?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReviewRecordPayloadDto {
  @ApiProperty({ type: [SmartGoalDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SmartGoalDto)
  smartGoals!: SmartGoalDto[];

  @ApiProperty({ type: WellbeingDto })
  @ValidateNested()
  @Type(() => WellbeingDto)
  wellbeing!: WellbeingDto;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  progressSummary?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  actionsAgreed?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  employerComments?: string;
}
