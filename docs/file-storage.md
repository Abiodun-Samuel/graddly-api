# File storage (S3 presigned URLs)

Graddly stores user-uploaded files in **Amazon S3** using **presigned URLs**. The API never receives file bytes; clients upload and download directly against S3.

## Configuration

| Variable | Default | Purpose |
|----------|---------|---------|
| `STORAGE_PROVIDER` | `noop` | `noop` (local/test) or `s3` (AWS) |
| `AWS_REGION` | `eu-west-2` | S3 region |
| `S3_BUCKET` | — | Bucket name per environment |
| `AWS_ACCESS_KEY_ID` | — | Optional explicit credentials for local dev |
| `AWS_SECRET_ACCESS_KEY` | — | Pair with access key locally |
| `S3_PRESIGN_UPLOAD_TTL_SECONDS` | `900` | Upload URL lifetime |
| `S3_PRESIGN_DOWNLOAD_TTL_SECONDS` | `300` | Download URL lifetime |

When `STORAGE_PROVIDER=noop`, the API returns fake `https://noop-storage.local/...` URLs (no AWS required).

## Object key layout

All keys are scoped under the active organisation from the JWT:

```
orgs/{organisationId}/learners/{learnerId}/{category}/{objectId}/{filename}
orgs/{organisationId}/{category}/{objectId}/{filename}
```

- **category**: `evidence`, `signature`, `export`, `attachment`, `general`
- **objectId**: UUID generated per presign request
- **filename**: sanitized basename (max 200 chars)

Download requests are rejected unless the key starts with `orgs/{activeOrgId}/`.

## HTTP API

Requires `Authorization: Bearer <token>` and an active organisation context.

| Method | Path | Body |
|--------|------|------|
| `POST` | `/api/v1/storage/upload-url` | `filename`, `contentType`, `contentLength`, `category`, optional `learnerId` |
| `POST` | `/api/v1/storage/download-url` | `key` (from upload response) |

### Upload flow

1. `POST /api/v1/storage/upload-url` with declared mime type and size.
2. `PUT` the file to `uploadUrl` with headers matching `contentType` and `contentLength`.
3. Persist `key` in your domain record (evidence, attachment, etc.) for later download.
4. `POST /api/v1/storage/download-url` with `key` when a signed download link is needed.

## Validation

| Rule | Limit |
|------|-------|
| Max file size | **25 MB** (`26_214_400` bytes) |
| Allowed MIME types | `application/pdf`, `image/jpeg`, `image/png`, `image/webp`, `image/heic`, `image/heif`, Word/Excel documents, `text/plain`, `text/csv` |

Validation runs when requesting an upload URL. S3 presigned PUT binds `Content-Type` and `Content-Length` so clients cannot change them after presigning.

## Security notes

- Cross-organisation download is blocked by key prefix checks.
- When creating KSB file evidence, the API validates that the storage key belongs to the organisation and matches `learners/{apprenticeId}/evidence/`. Generic presign still only format-checks `learnerId`.
- Use short TTLs in production; rotate AWS credentials via your secret manager.
