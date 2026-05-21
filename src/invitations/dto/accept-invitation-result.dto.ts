import { ApiProperty } from '@nestjs/swagger';

import { OrganisationRole } from '../../organisations/organisation-role.enum.js';

export class AcceptInvitationResultDto {
  @ApiProperty()
  organisationId!: string;

  @ApiProperty({ enum: OrganisationRole })
  role!: OrganisationRole;
}
