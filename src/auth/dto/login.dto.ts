import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: 'john@example.com',
    description: 'Registered email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'P@ssw0rd!',
    description: 'Account password',
  })
  @IsString()
  password!: string;
}
