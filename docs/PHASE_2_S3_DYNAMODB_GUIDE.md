# Phase 2: S3 And DynamoDB Guide

This guide preserves the Phase 2 planning notes for reopening later. It expands the short Phase 2 entry in `docs/REBUILD_PHASES.md` into a practical implementation path.

## Phase 2 Goal

Phase 2 replaces the local/mock upload workflow with real AWS storage and persistence.

The target workflow is:

```text
Next.js UI
  -> asks backend to create upload session
Backend/API route
  -> creates Video + UploadSession records in DynamoDB
  -> starts S3 multipart upload
  -> returns presigned URLs
Browser
  -> uploads file parts directly to S3
  -> tells backend to complete upload
Backend/API route
  -> completes multipart upload in S3
  -> updates DynamoDB state
```

Phase 2 is complete when the browser uploads a file directly to S3 and the app records the completed upload in DynamoDB.

## Why S3 Is The Best Default Storage Option

S3 should be the default storage layer for uploaded videos because videos are large binary files. Storing them in the app server, local disk, or DynamoDB would create scaling, cost, and reliability problems.

S3 is the best fit for this project because:

- It is built for object storage: source videos, thumbnails, HLS manifests, playlists, and segments.
- It supports multipart upload, which is essential for larger video files.
- It supports presigned URLs, allowing the browser to upload directly to S3 without sending large file bodies through Next.js.
- It is durable and cost-effective compared with storing binary data in a database.
- It integrates naturally with later phases: SQS, Lambda, workers, lifecycle rules, CloudFront, and IAM.
- It gives real practice with AWS Developer Associate topics already listed in `docs/AWS_SERVICES.md`.

For Phase 2, start with one private source bucket:

```text
STREAMOPS_SOURCE_BUCKET=streamops-dev-source-...
```

Later phases can decide whether playback assets use the same bucket with prefixes or a separate playback bucket.

Good Phase 2 key shape:

```text
source/{ownerId}/{videoId}/{safeFileName}
```

This keeps source uploads separate from generated playback assets, groups files by video, and avoids using the original filename as the true identity.

## What Not To Build Yet

Keep Phase 2 focused. Do not add these yet:

- SQS processing queue
- FFmpeg worker
- Cognito authentication
- Public playback delivery
- CloudFront
- Full SAM deployment
- Production IAM hardening beyond basic least-privilege dev permissions

Those belong to later phases.

## Step 1: Add Environment Config

Phase 2 needs only the AWS config required for S3 and DynamoDB:

```text
AWS_REGION=
AWS_PROFILE=
STREAMOPS_TABLE_NAME=
STREAMOPS_SOURCE_BUCKET=
```

Example local values:

```text
AWS_REGION=us-east-1
AWS_PROFILE=streamops-dev
STREAMOPS_TABLE_NAME=streamops-dev
STREAMOPS_SOURCE_BUCKET=streamops-dev-source-yourname
```

Why each value matters:

- `AWS_REGION` tells the SDK which AWS region to call.
- `AWS_PROFILE` keeps credentials out of code and uses the local AWS CLI profile.
- `STREAMOPS_TABLE_NAME` lets the app switch tables by environment.
- `STREAMOPS_SOURCE_BUCKET` avoids hardcoded bucket names.

## Step 2: Create The S3 Source Bucket

For Phase 2, the source bucket should be private.

Recommended bucket settings:

- Block public access: enabled.
- Server-side encryption: enabled.
- CORS: enabled for browser uploads.
- Lifecycle rule: abort incomplete multipart uploads after 1 day.

Why lifecycle matters:

If a browser starts a multipart upload and crashes halfway through, S3 can keep incomplete uploaded parts. Those parts cost money until they are cleaned up. A lifecycle rule handles cleanup automatically.

Example CORS for local development:

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3000
  }
]
```

`ETag` must be exposed because multipart completion requires the browser to send each part number and ETag back to the backend.

## Step 3: Create The DynamoDB Table

Use the single-table structure already suggested in `docs/DOMAIN_MODEL.md`.

Initial records needed for Phase 2:

```text
PK=USER#{ownerId}   SK=VIDEO#{videoId}
PK=VIDEO#{videoId}  SK=METADATA
PK=VIDEO#{videoId}  SK=UPLOAD#{uploadSessionId}
```

Why single-table design is a good fit here:

- The workflow is small and predictable.
- Access patterns are known upfront.
- Queries stay direct and cheap.
- Indexes can be added later only when required.
- It is useful practice for DynamoDB partition and sort key design.

Add a DynamoDB TTL attribute to upload session records:

```text
ttl = Unix timestamp seconds
```

Keep the domain field too:

```text
expiresAt = ISO string
```

Use both because `expiresAt` is useful to app logic and humans, while `ttl` is what DynamoDB uses for automatic expiry cleanup.

Important: DynamoDB TTL deletion is eventual, not immediate. The app must still reject expired sessions by checking `expiresAt`.

## Step 4: Add AWS Adapters

Keep the existing in-memory store. Add AWS-specific code separately under `packages/aws`.

Suggested files:

```text
packages/aws/src/config.ts
packages/aws/src/s3-upload-adapter.ts
packages/aws/src/dynamodb-workflow-store.ts
```

The S3 adapter should provide:

```text
createMultipartUpload()
presignUploadPartUrls()
completeMultipartUpload()
abortMultipartUpload()
```

The DynamoDB adapter should initially provide:

```text
createUpload()
getUploadSession()
getVideo()
listVideos()
completeUpload()
expireUpload()
```

Why adapters:

- Domain logic stays in `packages/core`.
- AWS SDK details stay in `packages/aws`.
- Local/mock mode can continue to work.
- Tests can run without needing AWS for every change.

## Step 5: Change Upload Creation

The current upload creation route is:

```text
apps/web/app/api/workflow/uploads/route.ts
```

Phase 2 should change `POST /api/workflow/uploads` so it:

1. Validates title, description, file name, file size, and MIME type.
2. Creates a `videoId` and `uploadSessionId`.
3. Builds an S3 object key.
4. Starts an S3 multipart upload.
5. Writes `Video` and `UploadSession` records to DynamoDB.
6. Generates presigned URLs for all parts.
7. Returns the video, upload session, and part URLs to the browser.

The response should include enough data for the browser to upload parts directly:

```ts
type CreateUploadResponse = {
  video: Video
  uploadSession: UploadSession
  presignedParts: Array<{
    partNumber: number
    url: string
  }>
}
```

## Step 6: Upload Parts From The Browser

The current upload UI simulates progress in:

```text
apps/web/components/streamops/upload-flow.tsx
```

Replace the fake progress loop with real browser-to-S3 uploads:

1. Slice the selected `File` into parts.
2. `PUT` each part to the matching presigned URL.
3. Read the `ETag` response header.
4. Store `{ partNumber, etag, size }`.
5. Send the uploaded parts to the complete endpoint.

Recommended starting part size:

```text
8 MB or 16 MB
```

Why not use very small parts:

- S3 multipart upload has part count limits.
- Too many parts create unnecessary request overhead.
- Larger parts reduce request count.
- 8-16 MB is practical for development.

For Phase 2, upload parts sequentially first. Parallel uploads can be tuned later in Phase 6.

## Step 7: Complete Multipart Upload

Add or update this endpoint:

```text
POST /api/workflow/uploads/{sessionId}/complete
```

The request body should include uploaded parts:

```json
{
  "parts": [
    { "partNumber": 1, "etag": "...", "size": 8388608 },
    { "partNumber": 2, "etag": "...", "size": 12000 }
  ]
}
```

The backend should:

1. Load the upload session from DynamoDB.
2. Check owner access.
3. Check that the session is still `active`.
4. Check that the session has not expired.
5. Call S3 `CompleteMultipartUpload`.
6. Update the upload session to `completed`.
7. Update the video to `uploaded`.
8. Save `sourceKey` on the video.

Completion belongs server-side because the backend should control final workflow state, ownership checks, expiry checks, and idempotency.

## Step 8: Use Conditional Writes

Conditional writes are one of the most important Phase 2 DynamoDB concepts.

Use conditions such as:

```text
Create video:
only if PK/SK does not already exist

Complete upload session:
only if status = active

Update video to uploaded:
only if status = uploading
```

Why this matters:

- Prevents duplicate records.
- Makes retries safer.
- Protects against double-clicked buttons.
- Protects against network retries.
- Supports the architecture principle: make every workflow idempotent.

## Step 9: Keep Local Fallback Mode

Do not remove the in-memory workflow store.

Use a config switch:

```text
WORKFLOW_STORE=memory
WORKFLOW_STORE=aws
```

Why this is useful:

- UI development can continue without AWS.
- Tests stay fast.
- AWS outages or credential issues do not block all local work.
- Phase 1 behavior remains available.

## Step 10: Acceptance Checklist

Phase 2 is done when these are true:

```text
[ ] S3 bucket exists and is private.
[ ] Bucket CORS allows local browser PUT uploads.
[ ] Bucket lifecycle aborts incomplete multipart uploads.
[ ] DynamoDB table exists.
[ ] Upload sessions include TTL.
[ ] Multipart upload starts from the app.
[ ] Browser uploads file parts directly to S3.
[ ] Browser captures ETags.
[ ] Backend completes multipart upload.
[ ] DynamoDB stores Video and UploadSession records.
[ ] Completed video has status uploaded.
[ ] Video sourceKey points to the S3 object key.
[ ] Reloading the dashboard still shows the uploaded video.
[ ] Expired sessions cannot be completed.
[ ] Duplicate complete calls do not corrupt state.
```

## Recommended Implementation Order

```text
1. Create AWS resources manually for dev.
2. Add packages/aws config.
3. Add S3 multipart helper.
4. Add DynamoDB serializer/store.
5. Wire API routes to AWS mode.
6. Replace fake browser progress with real S3 PUTs.
7. Add completion with conditional writes.
8. Test one real upload end to end.
```

## Existing Code References

Relevant current files:

```text
docs/REBUILD_PHASES.md
docs/ARCHITECTURE.md
docs/AWS_SERVICES.md
docs/DOMAIN_MODEL.md
docs/LOCAL_DEVELOPMENT.md
docs/SECURITY_PLAN.md
packages/core/src/types.ts
packages/core/src/transitions.ts
packages/core/src/memory-store.ts
apps/web/app/api/workflow/uploads/route.ts
apps/web/components/streamops/upload-flow.tsx
apps/web/lib/workflow/client.ts
```

Current project shape already supports this phase:

- `packages/core` contains domain types and transitions.
- `packages/aws` exists as the right place for AWS adapters.
- `apps/web` already has workflow API routes and an upload UI.
- The in-memory store can stay as local fallback mode.

## Worktree Note

At the time this guide was created, the worktree already had unrelated local changes:

```text
AD apps/web/.env.example
M  apps/web/app/layout.tsx
MM apps/web/next-env.d.ts
```

Do not overwrite or revert those changes unless they are intentionally handled.
