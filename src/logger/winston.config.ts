import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { Loggly } from 'winston-loggly-bulk';

export const winstonConfigFactory = (
  config: ConfigService,
): WinstonModuleOptions => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => {
          const ctx =
            typeof info['context'] === 'string'
              ? info['context']
              : 'Application';
          return `${String(info.timestamp)} [${ctx}] ${info.level}: ${String(info.message)} ${String(info['ms'])}`;
        }),
      ),
    }),
  ];

  const logglyToken = config.get<string>('app.loggly.token', '');
  const logglySubdomain = config.get<string>('app.loggly.subdomain', '');

  if (logglyToken && logglyToken !== 'your-loggly-token') {
    transports.push(
      new Loggly({
        token: logglyToken,
        subdomain: logglySubdomain,
        tags: ['graddly-api'],
        json: true,
      }),
    );
  }

  return { transports };
};
