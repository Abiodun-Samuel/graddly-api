import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SignupDto {
  @ApiProperty({
    example: 'John',
    description: 'First name of the user',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'Last name of the user',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({
    example: 'john@example.com',
    description: 'A valid, unique email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Password (minimum 8 characters)',
    minLength: 8,
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
