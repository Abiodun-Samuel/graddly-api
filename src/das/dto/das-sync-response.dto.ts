import { ApiProperty } from '@nestjs/swagger';

export class DasSyncResponseDto {
  @ApiProperty()
  jobId!: string;

  @ApiProperty({ example: 'queued' })
  status!: 'queued';
}
