# PDF generation (Phase J)

Graddly uses **pdfkit** for programmatic PDF generation (no Chromium). The API exposes a sync hello endpoint and async BullMQ jobs; the worker uploads completed PDFs via `StorageModule`.

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `PDF_PROVIDER` | `pdfkit` | `pdfkit` or `noop` (tests) |
| `STORAGE_PROVIDER` | `noop` | Use `noop` locally; `s3` in deployed envs |

See also [file-storage.md](./file-storage.md) for S3 settings.

## Sync hello PDF

```http
GET /api/v1/pdf/hello
Authorization: Bearer <token>
X-Organisation-Id: <org-uuid>   # optional if JWT has active org
```

Returns `application/pdf` bytes (`hello.pdf`).

### Docker proof

```bash
docker compose build api
docker compose run --rm api node -e "require('pdfkit')"
```

With the API running and a valid JWT:

```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3000/api/v1/pdf/hello \
  --output hello.pdf
file hello.pdf   # should report PDF document
```

## Async PDF jobs

```http
POST /api/v1/pdf/jobs
{ "template": "hello" }

GET /api/v1/pdf/jobs/:jobId
```

Poll `GET` until `status` is `completed` or `failed`. When completed, the response includes `outputKey` and a presigned `downloadUrl`.

Jobs are processed by the **worker** process (`yarn start:worker` or the combined `yarn start`). The `pdf` queue is registered in BullMQ ops when enabled.

## Templates (v1)

| Template | Description |
|----------|-------------|
| `hello` | Baseline pdfkit proof document |

More templates (reports, snapshots) will reuse `PdfService` in later phases.
