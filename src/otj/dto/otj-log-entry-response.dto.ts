import { ApiProperty } from '@nestjs/swagger';

import { OtjLogStatus } from '../enums/otj-log-status.enum.js';

export class OtjLogEntryResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ format: 'uuid' })
  enrolmentId!: string;

  @ApiProperty({ format: 'uuid' })
  apprenticeId!: string;

  @ApiProperty({ format: 'date' })
  loggedDate!: string;

  @ApiProperty()
  minutes!: number;

  @ApiProperty({ nullable: true })
  note!: string | null;

  @ApiProperty({ nullable: true, type: 'object', additionalProperties: true })
  evidence!: Record<string, unknown> | null;

  @ApiProperty({ enum: OtjLogStatus })
  status!: OtjLogStatus;

  @ApiProperty({ nullable: true })
  paceFlag!: string | null;

  @ApiProperty({ nullable: true })
  rejectionReason!: string | null;
}
