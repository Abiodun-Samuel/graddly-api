import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import {
  IPresignedDownloadRequest,
  IPresignedDownloadResult,
  IPresignedUploadRequest,
  IPresignedUploadResult,
  IPutObjectRequest,
  IStorageProvider,
} from '../interfaces/storage-provider.interface.js';

import { noopStorageObjects } from './noop-storage.store.js';

@Injectable()
export class NoopStorageProvider implements IStorageProvider {
  private readonly logger = new Logger(NoopStorageProvider.name);

  constructor(private readonly config: ConfigService) {}

  createUploadUrl(
    request: IPresignedUploadRequest,
  ): Promise<IPresignedUploadResult> {
    const bucket = this.config.get<string>('app.storage.bucket', 'noop-bucket');
    const expiresAt = new Date(Date.now() + request.expiresInSeconds * 1000);
    const uploadUrl = `https://noop-storage.local/${bucket}/${encodeURIComponent(request.key)}?expires=${expiresAt.getTime()}`;

    this.logger.debug(
      `Noop upload URL for ${request.key} (${request.contentType}, ${request.contentLength} bytes)`,
    );

    return Promise.resolve({ uploadUrl, expiresAt });
  }

  createDownloadUrl(
    request: IPresignedDownloadRequest,
  ): Promise<IPresignedDownloadResult> {
    const bucket = this.config.get<string>('app.storage.bucket', 'noop-bucket');
    const expiresAt = new Date(Date.now() + request.expiresInSeconds * 1000);
    const downloadUrl = `https://noop-storage.local/${bucket}/${encodeURIComponent(request.key)}?download=1&expires=${expiresAt.getTime()}`;

    this.logger.debug(`Noop download URL for ${request.key}`);

    return Promise.resolve({ downloadUrl, expiresAt });
  }

  putObject(request: IPutObjectRequest): Promise<void> {
    noopStorageObjects.set(request.key, Buffer.from(request.body));
    this.logger.debug(
      `Noop putObject ${request.key} (${request.body.length} bytes)`,
    );
    return Promise.resolve();
  }

  getObjectBuffer(key: string): Promise<Buffer> {
    const value = noopStorageObjects.get(key);
    if (!value) {
      return Promise.reject(new Error(`Noop object not found: ${key}`));
    }
    return Promise.resolve(Buffer.from(value));
  }
}
