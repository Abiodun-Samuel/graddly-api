import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

import { PdfJobTemplate } from '../enums/pdf-job-template.enum.js';

export class CreatePdfJobDto {
  @ApiProperty({ enum: PdfJobTemplate, example: PdfJobTemplate.HELLO })
  @IsEnum(PdfJobTemplate)
  template!: PdfJobTemplate;
}
