import 'dotenv/config';

import './config/env-bootstrap.js';

import './instrument.js';

import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import basicAuth from 'express-basic-auth';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

import { AppModule } from './app.module.js';
import { configureApp } from './configure-app.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));
  app.use(helmet());
  configureApp(app);

  const config = app.get(ConfigService);
  const port = config.get<number>('app.port', 3000);

  const swaggerUser = config.get<string>('app.swagger.username', 'graddly');
  const swaggerPass = config.get<string>(
    'app.swagger.password',
    'Gr4ddly!Sw4g@2026#Sec',
  );

  app.use(
    '/docs',
    basicAuth({ challenge: true, users: { [swaggerUser]: swaggerPass } }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Graddly API')
    .setDescription('The Graddly API documentation')
    .setVersion('0.1.0')
    .addBearerAuth({
      type: 'http',
      scheme: 'bearer',
      bearerFormat: 'JWT',
      description:
        'JWT access token. Claims: `sub` (user id), `email`, optional `orgId` (active organisation), optional `roles` (roles in that org). See docs/api/jwt-payload.md for details and client migration.',
    })
    .build();

  SwaggerModule.setup('docs', app, () =>
    SwaggerModule.createDocument(app, swaggerConfig),
  );

  await app.listen(port);
}
void bootstrap();
