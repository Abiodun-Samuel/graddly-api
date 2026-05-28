import { ApiProperty } from '@nestjs/swagger';

import { DasSyncStatus } from '../enums/das-sync-status.enum.js';

export class DasLevyBalanceResponseDto {
  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({ nullable: true })
  ukprn!: string | null;

  @ApiProperty({ nullable: true })
  accountId!: string | null;

  @ApiProperty({ nullable: true, example: '12345.67' })
  balance!: string | null;

  @ApiProperty({ nullable: true, example: 'GBP' })
  currency!: string | null;

  @ApiProperty({ enum: DasSyncStatus })
  lastSyncStatus!: DasSyncStatus;

  @ApiProperty({ nullable: true })
  lastErrorMessage!: string | null;

  @ApiProperty({ nullable: true })
  lastSyncedAt!: string | null;
}
