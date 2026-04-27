import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, Matches, MaxLength } from 'class-validator';

/** Lowercase slug: letters, numbers, single hyphens between segments (no leading/trailing hyphen). */
const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateOrganisationDto {
  @ApiProperty({ example: 'Acme Trust', maxLength: 255 })
  @IsNotEmpty()
  @MaxLength(255)
  name!: string;

  @ApiProperty({
    example: 'acme-trust',
    description:
      'URL-safe unique identifier (lowercase letters, numbers, hyphens).',
    maxLength: 100,
  })
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(SLUG_REGEX, {
    message:
      'slug must contain only lowercase letters, numbers, and single hyphens between segments',
  })
  slug!: string;
}
