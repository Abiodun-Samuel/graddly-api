import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreatePresignedDownloadDto {
  @ApiProperty({
    example: 'orgs/uuid/learners/uuid/evidence/uuid/file.pdf',
    description: 'Full S3 object key returned from upload-url',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(1024)
  key!: string;
}

export class PresignedDownloadResponseDto {
  @ApiProperty({ example: 'https://bucket.s3.amazonaws.com/...' })
  downloadUrl!: string;

  @ApiProperty({ type: String, format: 'date-time' })
  expiresAt!: Date;
}
