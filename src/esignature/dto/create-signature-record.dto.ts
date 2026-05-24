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
}
