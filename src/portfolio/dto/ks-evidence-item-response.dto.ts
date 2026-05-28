import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { KsEvidenceStatus } from '../enums/ks-evidence-status.enum.js';
import { KsEvidenceType } from '../enums/ks-evidence-type.enum.js';

import { KsbDefinitionResponseDto } from './ksb-definition-response.dto.js';

export class KsEvidenceItemResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  apprenticeId!: string;

  @ApiProperty({ enum: KsEvidenceType })
  type!: KsEvidenceType;

  @ApiProperty()
  title!: string;

  @ApiPropertyOptional({ nullable: true })
  body!: string | null;

  @ApiPropertyOptional({ nullable: true })
  storageKey!: string | null;

  @ApiPropertyOptional({ nullable: true })
  externalUrl!: string | null;

  @ApiProperty({ enum: KsEvidenceStatus })
  status!: KsEvidenceStatus;

  @ApiProperty({ type: [KsbDefinitionResponseDto] })
  ksbDefinitions!: KsbDefinitionResponseDto[];

  @ApiPropertyOptional({ nullable: true })
  submittedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  acceptedAt!: string | null;

  @ApiPropertyOptional({ nullable: true })
  returnReason!: string | null;
}
