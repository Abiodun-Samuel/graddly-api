import { ApiProperty } from '@nestjs/swagger';

export class BulkOtjActionResultItemDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty()
  ok!: boolean;

  @ApiProperty({ nullable: true })
  reasonCode!: string | null;

  @ApiProperty({ nullable: true })
  message!: string | null;

  @ApiProperty()
  notificationQueued!: boolean;
}

export class BulkOtjActionResponseDto {
  @ApiProperty()
  processed!: number;

  @ApiProperty()
  succeeded!: number;

  @ApiProperty()
  failed!: number;

  @ApiProperty({ type: [BulkOtjActionResultItemDto] })
  results!: BulkOtjActionResultItemDto[];
}
