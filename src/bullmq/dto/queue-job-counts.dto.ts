import { ApiProperty } from '@nestjs/swagger';

export class QueueJobCountsDto {
  @ApiProperty({ example: 0 })
  waiting!: number;

  @ApiProperty({ example: 0 })
  active!: number;

  @ApiProperty({ example: 0 })
  completed!: number;

  @ApiProperty({ example: 0 })
  failed!: number;

  @ApiProperty({ example: 0 })
  delayed!: number;

  @ApiProperty({ example: 0 })
  prioritized!: number;

  @ApiProperty({ example: 0 })
  waitingChildren!: number;
}
