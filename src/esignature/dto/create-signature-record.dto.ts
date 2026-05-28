import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateSignatureRecordDto {
  @ApiProperty({
    example: 'orgs/uuid/signature/obj/signature.png',
  })
  @IsString()
  @MaxLength(1024)
  signatureImageKey!: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  pdfJobId?: string;

  @ApiPropertyOptional({
    description:
      'Storage key of PDF to sign (used for chained co-sign when pdfJobId is omitted)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1024)
  sourcePdfKey?: string;
}
