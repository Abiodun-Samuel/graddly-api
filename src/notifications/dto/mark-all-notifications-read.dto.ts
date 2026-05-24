import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class MarkAllNotificationsReadDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Mark unread notifications for this organisation only',
  })
  @IsOptional()
  @IsUUID()
  organisationId?: string;
}
