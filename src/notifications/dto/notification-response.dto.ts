import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { NotificationType } from '../enums/notification-type.enum.js';

export class NotificationResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiProperty({ format: 'uuid' })
  userId!: string;

  @ApiPropertyOptional({ format: 'uuid', nullable: true })
  organisationId!: string | null;

  @ApiProperty({ enum: NotificationType })
  type!: NotificationType;

  @ApiProperty({ example: 'Invitation accepted' })
  title!: string;

  @ApiProperty({ example: 'You joined Acme Ltd.' })
  body!: string;

  @ApiPropertyOptional({ type: String, format: 'date-time', nullable: true })
  readAt!: Date | null;

  @ApiPropertyOptional({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown> | null;

  @ApiProperty({ type: String, format: 'date-time' })
  createdAt!: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  updatedAt!: Date;
}
