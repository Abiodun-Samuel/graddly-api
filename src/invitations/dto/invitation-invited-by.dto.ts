import { ApiProperty } from '@nestjs/swagger';

export class InvitationInvitedByDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  firstName!: string;

  @ApiProperty()
  lastName!: string;

  @ApiProperty()
  email!: string;
}
