import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { PdfJobStatus } from '../enums/pdf-job-status.enum.js';
import { PdfJobTemplate } from '../enums/pdf-job-template.enum.js';

export class PdfJobResponseDto {
  @ApiProperty({ format: 'uuid' })
  jobId!: string;

  @ApiProperty({ enum: PdfJobStatus })
  status!: PdfJobStatus;

  @ApiProperty({ enum: PdfJobTemplate })
  template!: PdfJobTemplate;

  @ApiPropertyOptional()
  outputKey!: string | null;

  @ApiPropertyOptional()
  errorMessage!: string | null;

  @ApiProperty()
  createdAt!: string;

  @ApiPropertyOptional({ nullable: true })
  completedAt!: string | null;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  downloadExpiresAt?: string;
}
