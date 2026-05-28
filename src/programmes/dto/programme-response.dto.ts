import { ApiProperty } from '@nestjs/swagger';

import { ProgrammeStatus } from '../enums/programme-status.enum.js';

export class ProgrammeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty()
  code!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty({ enum: ProgrammeStatus })
  status!: ProgrammeStatus;
}
