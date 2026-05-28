import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CreateEnrolmentDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  apprenticeId!: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  standardId!: string;
}
