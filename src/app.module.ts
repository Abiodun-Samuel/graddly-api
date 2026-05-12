import { ThrottlerStorageRedisService } from '@nest-lab/throttler-storage-redis';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SentryModule } from '@sentry/nestjs/setup';
import { WinstonModule } from 'nest-winston';

import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { CustomThrottlerGuard } from './common/guards/custom-throttler.guard.js';
import { CorrelationIdMiddleware } from './common/middleware/correlation-id.middleware.js';
import appConfig from './config/app.config.js';
import databaseConfig from './config/typeorm.config.js';
import { validateEnv } from './config/validate-env.js';
import { TenantSessionSubscriber } from './database/tenant-session.subscriber.js';
import { winstonConfigFactory } from './logger/winston.config.js';
import { OrganisationsModule } from './organisations/organisations.module.js';
import { RedisModule } from './redis/redis.module.js';
import { UsersModule } from './users/users.module.js';
import { HealthModule } from './health/health.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [appConfig, databaseConfig],
    }),
    SentryModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('database.host'),
        port: config.get<number>('database.port'),
        username: config.get<string>('database.username'),
        password: config.get<string>('database.password'),
        database: config.get<string>('database.database'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/*{.ts,.js}'],
        migrationsRun: true,
        synchronize: false,
        logging: config.get<boolean>('database.logging'),
        subscribers: [TenantSessionSubscriber],
      }),
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        throttlers: [
          { name: 'default', ttl: 60_000, limit: 100 },
          { name: 'auth', ttl: 60_000, limit: 5 },
        ],
        storage: new ThrottlerStorageRedisService({
          host: config.get<string>('app.redis.host', 'localhost'),
          port: config.get<number>('app.redis.port', 6379),
          password: config.get<string>('app.redis.password'),
          family: 0,
        }),
      }),
    }),
    WinstonModule.forRootAsync({
      inject: [ConfigService],
      useFactory: winstonConfigFactory,
    }),
    RedisModule,
    UsersModule,
    AuthModule,
    OrganisationsModule,
    HealthModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: CustomThrottlerGuard },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
  }
}
