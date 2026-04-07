import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserResponseDto {
  @ApiProperty({
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    description: 'Unique user identifier (UUID)',
  })
  id!: string;

  @ApiProperty({ example: 'John', description: 'First name of the user' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Last name of the user' })
  lastName!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'Email address (unique)',
  })
  email!: string;

  @ApiProperty({
    example: false,
    description: 'Whether the user has verified their email',
  })
  isEmailVerified!: boolean;

  @ApiProperty({
    example: true,
    description: 'Whether the account is active',
  })
  isActive!: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'URL to the user avatar image',
    nullable: true,
  })
  avatarUrl!: string | null;

  @ApiProperty({
    example: '2026-04-07T10:00:00.000Z',
    description: 'Account creation timestamp',
  })
  createdAt!: Date;

  @ApiProperty({
    example: '2026-04-07T10:00:00.000Z',
    description: 'Last profile update timestamp',
  })
  updatedAt!: Date;
}
