import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { SignatureRecordStatus } from '../enums/signature-record-status.enum.js';

export class SignatureRecordResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ enum: SignatureRecordStatus })
  status!: SignatureRecordStatus;

  @ApiProperty()
  signatureImageKey!: string;

  @ApiProperty()
  signatureImageHash!: string;

  @ApiProperty()
  signedAt!: string;

  @ApiProperty()
  clientIp!: string;

  @ApiPropertyOptional({ nullable: true })
  userAgent!: string | null;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  pdfGenerationJobId!: string | null;

  @ApiPropertyOptional({ nullable: true })
  signedPdfKey!: string | null;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  downloadExpiresAt?: string;
}

export class SignSignatureRecordResponseDto {
  @ApiProperty()
  signedPdfKey!: string;

  @ApiPropertyOptional()
  downloadUrl?: string;

  @ApiPropertyOptional()
  downloadExpiresAt?: string;
}
