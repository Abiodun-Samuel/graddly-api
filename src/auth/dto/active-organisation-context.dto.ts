import { ApiProperty } from '@nestjs/swagger';

export class ActiveOrganisationContextDto {
  @ApiProperty({ format: 'uuid' })
  organisationId!: string;

  @ApiProperty({
    type: [String],
    example: ['owner'],
    description: 'Roles in the active organisation',
  })
  roles!: string[];
}

export class ApiActiveOrganisationResponseDto {
  @ApiProperty({ example: 'Active organisation resolved' })
  message!: string;

  @ApiProperty({ type: ActiveOrganisationContextDto })
  data!: ActiveOrganisationContextDto;
}
