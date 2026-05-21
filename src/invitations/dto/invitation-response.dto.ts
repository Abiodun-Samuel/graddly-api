import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { OrganisationRole } from '../../organisations/organisation-role.enum.js';

import { InvitationInvitedByDto } from './invitation-invited-by.dto.js';

export class InvitationResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  email!: string;

  @ApiProperty({ enum: OrganisationRole })
  role!: OrganisationRole;

  @ApiProperty()
  expiresAt!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;

  @ApiPropertyOptional({ type: () => InvitationInvitedByDto, nullable: true })
  invitedBy!: InvitationInvitedByDto | null;
}
