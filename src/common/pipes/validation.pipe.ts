import {
  ValidationError,
  ValidationPipe as NestValidationPipe,
  ValidationPipeOptions,
} from '@nestjs/common';

import {
  IFormattedValidationErrors,
  ValidationException,
} from '../exceptions/validation.exception.js';

function formatErrors(errors: ValidationError[]): IFormattedValidationErrors {
  return errors.reduce((acc, error) => {
    let constraints: string | IFormattedValidationErrors;

    if (Array.isArray(error.children) && error.children.length) {
      constraints = formatErrors(error.children);
    } else if (error.constraints) {
      const values = Object.values(error.constraints);
      const last = values.pop();
      constraints = values.length
        ? `${values.join(', ')} and ${last}`
        : (last ?? '');
    } else {
      constraints = '';
    }

    return { ...acc, [error.property]: constraints };
  }, {} as IFormattedValidationErrors);
}

export class ValidationPipe extends NestValidationPipe {
  constructor(options?: ValidationPipeOptions) {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      ...options,
      exceptionFactory: (errors: ValidationError[]) =>
        new ValidationException(formatErrors(errors)),
    });
  }
}
