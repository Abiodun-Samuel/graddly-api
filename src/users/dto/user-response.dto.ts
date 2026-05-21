import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { ActiveOrganisationMeDto } from '../../auth/dto/active-organisation-context.dto.js';
import { UserGender } from '../enums/user-gender.enum.js';

export class UserResponseDto {
  @ApiProperty({ format: 'uuid' })
  id!: string;

  @ApiPropertyOptional({ example: 'Dr', nullable: true })
  title!: string | null;

  @ApiProperty({ example: 'Jane' })
  firstName!: string;

  @ApiProperty({ example: 'Smith' })
  lastName!: string;

  @ApiProperty({ example: 'jane@example.com' })
  email!: string;

  @ApiProperty({ example: false })
  isEmailVerified!: boolean;

  @ApiProperty({ example: true })
  isActive!: boolean;

  @ApiPropertyOptional({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl!: string | null;

  @ApiPropertyOptional({ example: '+44 7700 900123', nullable: true })
  phone!: string | null;

  @ApiPropertyOptional({ example: '1990-06-15', nullable: true })
  dateOfBirth!: Date | null;

  @ApiPropertyOptional({ enum: UserGender, nullable: true })
  gender!: UserGender | null;

  @ApiPropertyOptional({ example: 'Senior Training Manager', nullable: true })
  jobTitle!: string | null;

  @ApiPropertyOptional({ example: 'People & Development', nullable: true })
  department!: string | null;

  @ApiPropertyOptional({ example: 'Specialist in adult care workforce development.', nullable: true })
  bio!: string | null;

  @ApiProperty({ example: 'en-GB' })
  locale!: string;

  @ApiProperty({ example: 'Europe/London' })
  timezone!: string;

  @ApiPropertyOptional({ nullable: true })
  lastLoginAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class MeResponseDto extends UserResponseDto {
  @ApiProperty({
    description:
      'Active organisation whose portalType matches X-Portal-Type header. Null when the header is absent, unrecognised, or no active membership exists for that portal.',
    nullable: true,
    type: () => ActiveOrganisationMeDto,
  })
  activeOrganisation!: ActiveOrganisationMeDto | null;
}
