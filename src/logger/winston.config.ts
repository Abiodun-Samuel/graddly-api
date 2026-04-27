import { ConfigService } from '@nestjs/config';
import { WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import { Loggly } from 'winston-loggly-bulk';

import { getCorrelationId } from '../common/context/correlation-id-context.js';

const withRequestId = winston.format((info) => {
  const id = getCorrelationId();
  if (id) {
    info['requestId'] = id;
  }
  return info;
});

export const winstonConfigFactory = (
  config: ConfigService,
): WinstonModuleOptions => {
  const transports: winston.transport[] = [
    new winston.transports.Console({
      format: winston.format.combine(
        withRequestId(),
        winston.format.timestamp(),
        winston.format.ms(),
        winston.format.colorize({ all: true }),
        winston.format.printf((info) => {
          const ctx =
            typeof info['context'] === 'string'
              ? info['context']
              : 'Application';
          const reqId = getCorrelationId();
          const reqPart = reqId ? ` reqId=${reqId}` : '';
          return `${String(info.timestamp)} [${ctx}]${reqPart} ${info.level}: ${String(info.message)} ${String(info['ms'])}`;
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
        format: winston.format.combine(withRequestId(), winston.format.json()),
      }),
    );
  }

  return { transports };
};
