import { ApiProperty } from '@nestjs/swagger';

import { StandardStatus } from '../enums/standard-status.enum.js';

export class StandardResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  programmeId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: StandardStatus })
  status!: StandardStatus;
}
