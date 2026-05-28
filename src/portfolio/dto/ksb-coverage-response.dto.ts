import { ApiProperty } from '@nestjs/swagger';

import { KsbCoverageAssessment } from '../enums/ksb-coverage-assessment.enum.js';

export class KsbCoverageResponseDto {
  @ApiProperty({ format: 'uuid' })
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  ksbDefinitionId!: string;

  @ApiProperty({ enum: KsbCoverageAssessment })
  assessment!: KsbCoverageAssessment;

  @ApiProperty({ format: 'uuid' })
  assessedByUserId!: string;

  @ApiProperty()
  assessedAt!: string;
}
