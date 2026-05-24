import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { AuthModule } from '../auth/auth.module.js';

import { IStorageProvider } from './interfaces/storage-provider.interface.js';
import { NoopStorageProvider } from './providers/noop-storage.provider.js';
import { S3StorageProvider } from './providers/s3-storage.provider.js';
import { StorageKeyBuilder } from './storage-key.builder.js';
import { StorageValidationService } from './storage-validation.service.js';
import { STORAGE_PROVIDER } from './storage.constants.js';
import { StorageController } from './storage.controller.js';
import { StorageService } from './storage.service.js';

@Module({
  imports: [AuthModule],
  controllers: [StorageController],
  providers: [
    StorageKeyBuilder,
    StorageValidationService,
    StorageService,
    NoopStorageProvider,
    S3StorageProvider,
    {
      provide: STORAGE_PROVIDER,
      useFactory: (
        config: ConfigService,
        noop: NoopStorageProvider,
        s3: S3StorageProvider,
      ): IStorageProvider => {
        const provider = config.get<'s3' | 'noop'>(
          'app.storage.provider',
          'noop',
        );
        return provider === 's3' ? s3 : noop;
      },
      inject: [ConfigService, NoopStorageProvider, S3StorageProvider],
    },
  ],
  exports: [StorageService, StorageKeyBuilder],
})
export class StorageModule {}
