# Rebuild Phases

This file tracks rebuild progress. Percentages are practical implementation estimates, not strict task counts.

## Overall Progress

```text
Overall rebuild progress: 56%
```

Completed foundation:

- Local domain model and mock workflow.
- Real S3 multipart uploads from the browser.
- Real DynamoDB workflow persistence.
- Real SQS queue handoff.
- Local Node worker.
- Lambda-ready SQS handler entry point.
- Real FFmpeg probe, thumbnail generation, and adaptive HLS asset generation.
- Video detail inspection links for generated playback assets.

Main work remaining:

- Deployable AWS SAM stack.
- Cognito authentication and owner enforcement from real identities.
- Production-grade IAM, secrets/config, logs, metrics, traces, and deployment operations.

## Phase 0: Project Cut

Progress: 100%

Goal: define the minimal rebuild.

- [x] Create repo structure.
- [x] Document architecture.
- [x] Define workflow statuses.
- [x] Define acceptance scenarios.
- [x] Choose AWS SAM.

Exit criteria:

- [x] Docs explain what will be built and what is intentionally excluded.

Evidence:

- `docs/ARCHITECTURE.md`
- `docs/DOMAIN_MODEL.md`
- `docs/ACCEPTANCE_SCENARIOS.md`
- `docs/DEPLOYMENT_PLAN.md`

## Phase 1: Local Domain Skeleton

Progress: 100%

Goal: prove workflow behavior without AWS dependencies.

- [x] Create `packages/core`.
- [x] Define `Video`, `UploadSession`, `ProcessingRun`, and `VideoRendition` types.
- [x] Add status transition helpers.
- [x] Add validation.
- [x] Add in-memory adapters.
- [x] Create a minimal Next.js upload/dashboard flow.

Exit criteria:

- [x] A user can create a mocked upload session and see status transitions locally.

Evidence:

- `packages/core/src/types.ts`
- `packages/core/src/transitions.ts`
- `packages/core/src/memory-store.ts`
- `packages/core/src/workflow.test.ts`
- `apps/web/components/streamops/upload-flow.tsx`
- `apps/web/components/streamops/dashboard-client.tsx`

## Phase 2: S3 And DynamoDB

Progress: 100%

Goal: replace mocks with real AWS storage and persistence.

- [x] Add S3 multipart upload creation.
- [x] Generate presigned part URLs.
- [x] Complete multipart uploads.
- [x] Persist state in DynamoDB.
- [x] Use conditional writes for idempotency.
- [x] Add TTL for expired upload sessions.
- [x] Configure S3 CORS to expose `ETag`.
- [x] Add AWS SDK adapters.
- [x] Wire upload creation route to AWS mode.
- [x] Upload browser file parts directly to S3.
- [x] Wire dashboard and video detail reads to DynamoDB.

Exit criteria:

- [x] Browser uploads a file directly to S3 and the app records the completed upload.
- [x] Dashboard shows uploaded videos from DynamoDB after refresh.

Evidence:

- `packages/aws/src/s3-upload-adapter.ts`
- `packages/aws/src/dynamodb-workflow-store.ts`
- `apps/web/app/api/workflow/uploads/route.ts`
- `apps/web/app/api/workflow/uploads/[sessionId]/complete/route.ts`
- `apps/web/app/api/workflow/videos/route.ts`
- `infra/s3/source-bucket-cors.dev.json`
- `docs/PHASE_2_S3_DYNAMODB_GUIDE.md`

## Phase 3: Queue And Processing

Progress: 90%

Goal: add asynchronous processing.

- [x] Send processing messages to SQS.
- [x] Add DLQ.
- [x] Build a Node worker.
- [x] Add Lambda-ready SQS handler entry point.
- [x] Add lightweight FFmpeg integration.
- [x] Run `ffprobe` and persist real duration/resolution metadata.
- [x] Generate and upload a real thumbnail.
- [x] Generate and upload HLS master manifest, rendition playlists, and segments.
- [x] Select adaptive HLS renditions from 1080p, 720p, and 480p based on the source's effective quality.
- [x] Store generated thumbnail/HLS asset keys.
- [x] Track processing runs.
- [x] Store generated rendition records in DynamoDB.
- [x] Verify HLS end to end on a fresh upload after the latest HLS code.
- [x] Add a playback surface or manifest/asset inspection link.
- [ ] Add explicit DLQ/failure test scenario.
- [ ] Improve worker logs around SQS message IDs, run IDs, and generated asset counts.

Exit criteria:

- [x] Uploaded videos move from `queued` to `processing` to `ready`, or to `failed` with useful error details.
- [x] Ready videos expose inspectable generated HLS output.
- [ ] Failed worker messages can be observed in the DLQ.

Evidence:

- `packages/aws/src/sqs-processing-queue.ts`
- `apps/web/app/api/workflow/videos/[videoId]/queue/route.ts`
- `apps/worker/src/index.ts`
- `apps/worker/src/lambda.ts`
- `apps/worker/src/processor.ts`
- `apps/worker/src/media.ts`
- `docs/PHASE_3_WORKER_LAMBDA_NOTES.md`

## Phase 4: Auth And Security

Progress: 10%

Goal: practice AWS-native authentication and authorization.

- [ ] Add Cognito.
- [ ] Validate JWTs server-side.
- [ ] Enforce owner checks from authenticated user identity.
- [ ] Replace hardcoded `LOCAL_OWNER_ID`.
- [x] Add initial least-privilege IAM policy for dev S3, DynamoDB, and SQS access.
- [ ] Add production least-privilege IAM policies.
- [ ] Move configuration to AWS-managed config/secrets.
- [ ] Add log sanitization.

Exit criteria:

- [ ] Users can access only their own creator resources.

Evidence:

- Current owner checks exist at the domain/store layer.
- Real Cognito identity is not implemented yet.

## Phase 5: Deployment

Progress: 10%

Goal: deploy repeatably.

- [ ] Add AWS SAM stack.
- [ ] Provision S3, DynamoDB, SQS, Lambda, Cognito, and CloudWatch resources.
- [ ] Add environment configuration.
- [ ] Add deployment test events.
- [ ] Add rollback practice.
- [x] Prepare Lambda-compatible worker handler.

Exit criteria:

- [ ] A dev AWS environment can be created, updated, tested, and deleted.

Evidence:

- `apps/worker/src/lambda.ts`
- `infra/sam/.gitkeep`

## Phase 6: Observability And Optimization

Progress: 5%

Goal: make operations visible.

- [ ] Add structured logs.
- [ ] Add EMF metrics.
- [ ] Add trace/correlation IDs.
- [ ] Add health checks.
- [ ] Add Logs Insights examples.
- [ ] Tune upload parallelism and worker concurrency.
- [ ] Add cache headers for public assets.
- [x] Add basic worker logs.

Exit criteria:

- [ ] Common failures can be diagnosed from logs, metrics, and traces.

Evidence:

- `docs/OBSERVABILITY_PLAN.md`
- Basic console logging exists in the worker only.

## Current Next Steps

Recommended order from here:

1. Add an intentional worker failure test and confirm DLQ behavior.
2. Improve worker logs around SQS message IDs, run IDs, and generated asset counts.
3. Start Phase 5 SAM infrastructure for S3, DynamoDB, SQS, and the Lambda-ready worker.
4. Start Phase 4 Cognito after deployment basics are stable.
