import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { KsbCoverageAssessment } from '../enums/ksb-coverage-assessment.enum.js';
import { KsbHeatmapStrength } from '../enums/ksb-heatmap-strength.enum.js';
import { KsbKind } from '../enums/ksb-kind.enum.js';

export class KsbHeatmapCellResponseDto {
  @ApiProperty({ format: 'uuid' })
  ksbDefinitionId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty({ enum: KsbKind })
  kind!: KsbKind;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  evidenceCount!: number;

  @ApiProperty({ enum: KsbHeatmapStrength })
  strength!: KsbHeatmapStrength;

  @ApiPropertyOptional({ enum: KsbCoverageAssessment, nullable: true })
  tutorAssessment!: KsbCoverageAssessment | null;

  @ApiProperty({ type: [String] })
  evidenceItemIds!: string[];
}

export class KsbHeatmapResponseDto {
  @ApiProperty({ format: 'uuid' })
  enrolmentId!: string;

  @ApiProperty({ type: [KsbHeatmapCellResponseDto] })
  cells!: KsbHeatmapCellResponseDto[];
}
