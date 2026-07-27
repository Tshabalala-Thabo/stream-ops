# Rebuild Phases

## Phase 0: Project Cut

Goal: define the minimal rebuild.

- Create repo structure.
- Document architecture.
- Define workflow statuses.
- Define acceptance scenarios.
- Choose AWS SAM.

Exit criteria:

- Docs explain what will be built and what is intentionally excluded.

## Phase 1: Local Domain Skeleton

Goal: prove workflow behavior without AWS dependencies.

- Create `packages/core`.
- Define `Video`, `UploadSession`, `ProcessingRun`, and `VideoRendition` types.
- Add status transition helpers.
- Add validation.
- Add in-memory adapters.
- Create a minimal Next.js upload/dashboard flow.

Exit criteria:

- A user can create a mocked upload session and see status transitions locally.

## Phase 2: S3 And DynamoDB

Goal: replace mocks with real AWS storage and persistence.

- Add S3 multipart upload creation.
- Generate presigned part URLs.
- Complete multipart uploads.
- Persist state in DynamoDB.
- Use conditional writes for idempotency.
- Add TTL for expired upload sessions.

Exit criteria:

- Browser uploads a file directly to S3 and the app records the completed upload.

## Phase 3: Queue And Processing

Goal: add asynchronous processing.

- Send processing messages to SQS.
- Add DLQ.
- Build a Node worker.
- Add lightweight FFmpeg integration.
- Store generated thumbnail/HLS asset keys.
- Track processing runs.

Exit criteria:

- Uploaded videos move from `queued` to `processing` to `ready`, or to `failed` with useful error details.

## Phase 4: Auth And Security

Goal: practice AWS-native authentication and authorization.

- Add Cognito.
- Validate JWTs server-side.
- Enforce owner checks.
- Add least-privilege IAM policies.
- Move configuration to AWS-managed config/secrets.
- Add log sanitization.

Exit criteria:

- Users can access only their own creator resources.

## Phase 5: Deployment

Goal: deploy repeatably.

- Add AWS SAM stack.
- Provision S3, DynamoDB, SQS, Lambda, Cognito, and CloudWatch resources.
- Add environment configuration.
- Add deployment test events.
- Add rollback practice.

Exit criteria:

- A dev AWS environment can be created, updated, tested, and deleted.

## Phase 6: Observability And Optimization

Goal: make operations visible.

- Add structured logs.
- Add EMF metrics.
- Add trace/correlation IDs.
- Add health checks.
- Add Logs Insights examples.
- Tune upload parallelism and worker concurrency.
- Add cache headers for public assets.

Exit criteria:

- Common failures can be diagnosed from logs, metrics, and traces.
