export interface IPresignedUploadRequest {
  key: string;
  contentType: string;
  contentLength: number;
  expiresInSeconds: number;
}

export interface IPresignedUploadResult {
  uploadUrl: string;
  expiresAt: Date;
}

export interface IPresignedDownloadRequest {
  key: string;
  expiresInSeconds: number;
}

export interface IPresignedDownloadResult {
  downloadUrl: string;
  expiresAt: Date;
}

export interface IPutObjectRequest {
  key: string;
  body: Buffer;
  contentType: string;
}

export interface IStorageProvider {
  createUploadUrl(
    request: IPresignedUploadRequest,
  ): Promise<IPresignedUploadResult>;

  createDownloadUrl(
    request: IPresignedDownloadRequest,
  ): Promise<IPresignedDownloadResult>;

  putObject(request: IPutObjectRequest): Promise<void>;

  getObjectBuffer(key: string): Promise<Buffer>;
}
