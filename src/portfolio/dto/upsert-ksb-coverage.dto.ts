import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { KsbCoverageAssessment } from '../enums/ksb-coverage-assessment.enum.js';

export class UpsertKsbCoverageDto {
  @ApiProperty({ enum: KsbCoverageAssessment })
  @IsEnum(KsbCoverageAssessment)
  assessment!: KsbCoverageAssessment;
}
