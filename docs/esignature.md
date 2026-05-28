# E-signature (Phase J)

Captures signature metadata (S3 image ref, SHA-256 hash, IP, timestamp) and produces a signed PDF artefact stored under the organisation export prefix.

## Client flow

1. **Upload signature image** — `POST /api/v1/storage/upload-url` with `category: signature`, `contentType: image/png`, then `PUT` the PNG to the presigned URL.
2. **Generate source PDF** (optional but required for sign) — `POST /api/v1/pdf/jobs` with `{ "template": "hello" }`, poll until `completed`.
3. **Create signature record** — `POST /api/v1/esignature/records`:

```json
{
  "signatureImageKey": "orgs/<orgId>/signature/<objectId>/signature.png",
  "pdfJobId": "<completed-pdf-job-uuid>"
}
```

For chained co-sign (party 2+), pass `sourcePdfKey` instead of `pdfJobId` (the previous party’s `signedPdfKey`):

```json
{
  "signatureImageKey": "orgs/<orgId>/signature/<objectId>/signature.png",
  "sourcePdfKey": "orgs/<orgId>/export/<recordId>/signed-<id>.pdf"
}
```

4. **Complete signing** — `POST /api/v1/esignature/records/:id/sign` embeds the signature image into a new PDF and stores it at `orgs/<orgId>/export/<recordId>/signed-<id>.pdf`.

## Metadata captured

| Field | Source |
|-------|--------|
| `signatureImageHash` | SHA-256 of image bytes from storage |
| `signedAt` | Server timestamp at record creation |
| `clientIp` | Request IP (`trust proxy` enabled for load balancers) |
| `userAgent` | `User-Agent` header |

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/v1/esignature/records` | Create pending record |
| `GET` | `/api/v1/esignature/records/:id` | Signer or org admin/owner |
| `POST` | `/api/v1/esignature/records/:id/sign` | Embed signature + store signed PDF |

Signed records are idempotent: calling `/sign` again returns the existing `signedPdfKey`.

## Review co-sign (Phase N)

Reviews use `POST /api/v1/reviews/:id/sign` with `{ party, signatureImageKey }`. The API orchestrates three sequential signatures (apprentice → tutor → employer manager) via the e-signature service:

1. Party 1 signs the completed `review_snapshot` PDF job output (`pdfJobId`).
2. Parties 2 and 3 sign the cumulative PDF from the previous party (`sourcePdfKey`).

## Commitment co-sign (Phase O)

Commitments use `POST /api/v1/commitment-statements/:id/sign` with the same `{ party, signatureImageKey }` contract and sequential order as reviews. Party 1 signs the `commitment_snapshot` PDF; parties 2 and 3 chain via `sourcePdfKey`.

Shared orchestration lives in `src/signing/sequential-co-sign.orchestrator.ts`. See [commitments.md](./commitments.md).

## Out of scope (later)

- Generic multi-party routing outside reviews/commitments
- Learner membership validation on storage keys
- Virus scanning
