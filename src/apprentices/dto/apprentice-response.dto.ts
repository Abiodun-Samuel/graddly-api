import { ApiProperty } from '@nestjs/swagger';

import { ApprenticeStatus } from '../enums/apprentice-status.enum.js';

export class ApprenticeResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: ApprenticeStatus })
  status!: ApprenticeStatus;
}
