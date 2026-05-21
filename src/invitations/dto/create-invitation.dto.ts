import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';

import { OrganisationRole } from '../../organisations/organisation-role.enum.js';

export class CreateInvitationDto {
  @ApiProperty({ example: 'colleague@example.com' })
  @Transform(({ value }: { value: unknown }): string => {
    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }
    return String(value);
  })
  @IsEmail()
  @MaxLength(320)
  email!: string;

  @ApiProperty({ enum: OrganisationRole, example: OrganisationRole.MEMBER })
  @IsEnum(OrganisationRole)
  role!: OrganisationRole;

  @ApiPropertyOptional({
    description:
      'When the invitation expires (ISO 8601). Defaults to 14 days from now.',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
