import { ApiProperty } from '@nestjs/swagger';

import { AuthResponseDto } from '../../auth/dto/auth-response.dto.js';
import { UserResponseDto } from '../../users/dto/user-response.dto.js';

export class ApiAuthResponseDto {
  @ApiProperty({ example: 'Logged in successfully' })
  message!: string;

  @ApiProperty({ type: AuthResponseDto })
  data!: AuthResponseDto;
}

export class ApiUserResponseDto {
  @ApiProperty({ example: 'User profile retrieved' })
  message!: string;

  @ApiProperty({ type: UserResponseDto })
  data!: UserResponseDto;
}
