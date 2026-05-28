import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateReviewDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID('4')
  apprenticeId!: string;

  @ApiProperty({
    example: '2026-06-15T10:00:00.000Z',
    description: 'Scheduled review date/time (ISO 8601)',
  })
  @IsDateString()
  scheduledAt!: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  title?: string;

  @ApiPropertyOptional({ maxLength: 50 })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  reviewType?: string;

  @ApiProperty({
    format: 'uuid',
    description: 'Apprentice signer user account',
  })
  @IsUUID('4')
  apprenticeUserId!: string;

  @ApiProperty({ format: 'uuid', description: 'Tutor/assessor signer user' })
  @IsUUID('4')
  tutorUserId!: string;

  @ApiProperty({ format: 'uuid', description: 'Employer manager signer user' })
  @IsUUID('4')
  employerManagerUserId!: string;
}
