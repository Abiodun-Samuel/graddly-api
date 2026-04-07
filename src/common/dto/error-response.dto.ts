import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 401, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({
    example: 'Invalid credentials',
    description: 'Short error description',
  })
  message!: string;

  @ApiPropertyOptional({
    example: 'Unauthorized',
    description: 'HTTP error name',
  })
  error?: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: 422, description: 'HTTP status code' })
  statusCode!: number;

  @ApiProperty({ example: 'Validation Error' })
  message!: string;

  @ApiProperty({
    example: {
      firstName: 'firstName must be shorter than or equal to 100 characters',
      email: 'email must be an email',
    },
    description: 'Field-keyed validation errors',
  })
  errors!: Record<string, string | Record<string, string>>;

  @ApiProperty({ example: '/auth/signup' })
  path!: string;

  @ApiProperty({ example: '2026-04-07T10:00:00.000Z' })
  timestamp!: string;
}

export class TooManyRequestsResponseDto {
  @ApiProperty({ example: 429 })
  statusCode!: number;

  @ApiProperty({ example: 'ThrottlerException: Too Many Requests' })
  message!: string;
}
