import { ApiProperty } from '@nestjs/swagger';

import { OrganisationSummaryDto } from '../../organisations/dto/organisation-response.dto.js';
import { MembershipStatus } from '../../organisations/membership-status.enum.js';

export class ActiveOrganisationMeDto {
  @ApiProperty({
    type: [String],
    example: ['owner'],
    description: 'Roles held in the active organisation',
  })
  roles!: string[];

  @ApiProperty({
    enum: MembershipStatus,
    example: MembershipStatus.ACTIVE,
    description: 'Current membership status',
  })
  membershipStatus!: MembershipStatus;

  @ApiProperty({ type: () => OrganisationSummaryDto })
  organisation!: OrganisationSummaryDto;
}
