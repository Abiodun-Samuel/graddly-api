import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AcceptInvitationDto {
  @ApiProperty({
    format: 'uuid',
    description: 'Opaque accept token from the invitation email link.',
  })
  @IsUUID('4')
  token!: string;
}
