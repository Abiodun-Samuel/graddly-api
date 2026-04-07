import { HttpException, HttpStatus } from '@nestjs/common';

export interface IFormattedValidationErrors {
  [key: string]: string | IFormattedValidationErrors;
}

export class ValidationException extends HttpException {
  constructor(public readonly errors: IFormattedValidationErrors) {
    super(
      {
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        message: 'Validation Error',
        errors,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
