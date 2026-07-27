# AWS DVA-C02 Next.js + Node Rearchitecture Plan

This plan checks whether StreamOps can be rebuilt as a minimal AWS Certified Developer - Associate practice project using only Next.js and Node.js/TypeScript application code.

## Feasibility

Yes, this is feasible.

The current project already has the right learning domain: authenticated video uploads, object storage, upload sessions, asynchronous processing, queue handoff, status transitions, retries, generated assets, and operational visibility.

The main rearchitecture is not a feature expansion. It is a stack reduction:

- Remove Laravel, PHP, Sanctum, Eloquent, Spatie Media Library, PHP queues, and PHP workers.
- Keep Next.js for the web app, authenticated creator flows, dashboard, API route handlers where useful, and browser upload orchestration.
- Use plain Node.js/TypeScript for reusable domain logic, AWS SDK calls, Lambda handlers, queue workers, FFmpeg orchestration, tests, and scripts.
- Use AWS managed services directly so the rebuild becomes exam practice rather than just a framework migration.

## Important Exam Guide Note

The local PDF/snippet is Version 1.3. The AWS documentation currently publishes Version 2.1 for DVA-C02, published December 12, 2024. The domain weights are still:

- Development with AWS Services: 32%
- Security: 26%
- Deployment: 24%
- Troubleshooting and Optimization: 18%

Use the current AWS guide for final study tracking. The Version 1.3 snippet remains useful, but it misses later added skills such as Amazon Q Developer, EventBridge patterns, third-party resilience patterns, application-level authorization, multi-tenant data access, health checks, and application-level caching.

## Minimal Target Architecture

```text
Browser
  |
  v
Next.js App Router
  - UI pages
  - Server Components for reads
  - Server Actions for app-owned mutations
  - Route Handlers for public API/webhook-style endpoints
  |
  v
Node/TypeScript domain package
  - validation
  - upload state transitions
  - idempotency helpers
  - AWS SDK adapters
  - logging/metrics helpers
  |
  +--> Cognito for auth/JWTs
  +--> DynamoDB for videos, upload sessions, processing runs, renditions
  +--> S3 for original videos, thumbnails, HLS manifests, HLS segments
  +--> SQS + DLQ for processing jobs
  +--> Lambda Node handlers for presign, complete upload, status updates, lightweight processing hooks
  +--> Optional ECS/Fargate Node worker for FFmpeg-heavy transcoding
  +--> EventBridge for lifecycle events
  +--> CloudWatch + X-Ray for logs, metrics, traces
  +--> KMS, Secrets Manager, Parameter Store/AppConfig for security/config
```

Keep FFmpeg out of Lambda for the main transcoding path if the processing becomes large or long-running. For exam practice, Lambda can still handle presigned upload URLs, S3 event handling, queue message validation, metadata updates, and small transformation exercises. Use an ECS/Fargate worker only when the video workload exceeds practical Lambda limits.

## Proposed Repo Shape

```text
stream-ops/
  apps/
    web/                  # Next.js app, migrated from current web/
    worker/               # Node worker for SQS + FFmpeg
  packages/
    core/                 # domain types, status machines, validation
    aws/                  # AWS SDK clients and adapters
    observability/        # structured logs, EMF metrics, tracing helpers
  infra/
    sam/ or cdk/          # DVA practice IaC
  docs/
    exam-practicals/      # lab notes mapped to DVA domains
```

For the first rebuild, avoid adding Express, Nest, Prisma, BullMQ, Redis, or a separate API framework. The learning goal is AWS developer fluency, not replacing Laravel with another backend framework.

## Domain Model

Keep the current business model but simplify it:

- `Video`: owner, title, description, status, source object key, thumbnail key, manifest key, duration, dimensions, processing error.
- `UploadSession`: video id, owner id, status, object key, multipart upload id, part size, total parts, uploaded parts, expiry.
- `ProcessingRun`: video id, status, started/finished timestamps, stage, error, metadata.
- `VideoRendition`: video id, label, width, height, bitrate, playlist key, segment prefix.

Suggested DynamoDB layout:

- Minimal path: one table with partition/sort keys.
- Partition examples:
  - `PK=USER#{userId}`, `SK=VIDEO#{videoId}`
  - `PK=VIDEO#{videoId}`, `SK=METADATA`
  - `PK=VIDEO#{videoId}`, `SK=UPLOAD#{uploadSessionId}`
  - `PK=VIDEO#{videoId}`, `SK=RUN#{runId}`
  - `PK=VIDEO#{videoId}`, `SK=RENDITION#{label}`
- Add GSIs only when a real access pattern needs them.

This gives direct practice with partition keys, query vs scan, item serialization, TTL, conditional writes, and idempotency.

## Domain-Phased Rebuild Plan

### Phase 0: Study Baseline And Architecture Cut

Goal: define the minimal project and stop rebuilding non-exam complexity.

- Decide the minimal app outcome: login, upload, process, list, play, observe.
- Keep only the existing StreamOps concepts that map to DVA-C02.
- Archive Laravel behavior into notes before deleting/replacing code.
- Create a domain status map:
  - `uploading -> uploaded -> queued -> processing -> ready`
  - failure states: `failed`, `cancelled`, `expired`
- Write acceptance tests as JSON scenarios before implementation.

Exam focus:

- Architectural patterns, stateful vs stateless, sync vs async, loose coupling, idempotency.

### Phase 1: Development With AWS Services, 32%

Goal: make the app talk directly to AWS services through Node/TypeScript code.

- Build `packages/core` with types, validation, state transitions, and idempotency keys.
- Build `packages/aws` with small adapters for S3, DynamoDB, SQS, and EventBridge.
- Implement create upload session:
  - Create `Video`.
  - Create `UploadSession`.
  - Start S3 multipart upload.
  - Return presigned part URLs.
- Implement browser direct-to-S3 multipart upload from the Next.js upload page.
- Implement complete upload:
  - Validate ownership.
  - Complete S3 multipart upload.
  - Use conditional writes to avoid duplicate completion.
  - Send SQS processing message.
- Implement processing consumer:
  - Read SQS message.
  - Mark video `processing`.
  - Generate thumbnail/HLS in a Node worker.
  - Upload generated assets to S3.
  - Mark video `ready`.
- Add DLQ behavior and retry-safe processing.

AWS practicals:

- S3 multipart upload and lifecycle rules.
- DynamoDB conditional writes, TTL, high-cardinality keys, query vs scan.
- SQS visibility timeout, DLQ, idempotent consumers.
- EventBridge event publication for upload completed and processing completed.
- Lambda handlers for small AWS integrations.

### Phase 2: Security, 26%

Goal: replace Sanctum/session assumptions with AWS-native auth and secret handling.

- Use Cognito User Pool for browser sign-in.
- Validate JWTs in Next.js server code and Lambda handlers.
- Store `ownerId` on every item and enforce ownership checks in code.
- Practice least privilege IAM:
  - web/API role can create upload sessions and presign S3 parts.
  - worker role can read source objects, write generated assets, and update processing state.
  - no role gets broad `s3:*` or `dynamodb:*`.
- Use KMS encryption for S3 and DynamoDB where applicable.
- Move secrets/config to Secrets Manager, Parameter Store, or AppConfig.
- Sanitize logs so tokens, presigned URLs, and object keys with sensitive user data do not leak.

AWS practicals:

- Cognito user pools vs identity pools.
- JWT bearer tokens.
- STS role assumptions.
- IAM identity policies and resource policies.
- KMS managed vs customer-managed keys.
- Secrets Manager and Parameter Store.

### Phase 3: Deployment, 24%

Goal: package and deploy the app repeatedly while learning AWS deployment surfaces.

- Add IaC under `infra/` using AWS SAM or CDK.
- Keep the first deployment small:
  - S3 buckets
  - DynamoDB table
  - SQS queue + DLQ
  - Lambda handlers
  - Cognito User Pool
  - CloudWatch log groups
- Deploy the Next.js app separately:
  - simplest AWS path: Amplify Hosting for Next.js
  - container path: standalone Next.js output on ECS/App Runner
- Add dev/test/prod config separation.
- Add integration test events for Lambda, SQS, API-style handlers, and upload completion.
- Add build/test/deploy scripts.
- Practice one deployment strategy:
  - Lambda aliases/canary where appropriate.
  - container image tags if using a worker container.

AWS practicals:

- SAM/CDK/CloudFormation updates.
- Lambda deployment package options.
- Environment-specific config.
- CodeBuild/CodePipeline concepts.
- Rollbacks, aliases, labels, branches, and release versions.

### Phase 4: Troubleshooting And Optimization, 18%

Goal: make failures visible and tune the app deliberately.

- Add structured JSON logging everywhere.
- Add CloudWatch EMF custom metrics:
  - upload sessions created
  - upload completion failures
  - processing duration
  - processing failures
  - SQS message age
- Add X-Ray tracing or trace identifiers through request, queue, and worker boundaries.
- Add `/api/health` and worker readiness checks.
- Add dashboard panels in Next.js for processing runs and recent failures.
- Add log query notes for common incidents:
  - expired upload session
  - failed multipart completion
  - missing S3 object
  - DLQ message
  - FFmpeg failure
- Tune concurrency:
  - browser multipart upload parallelism
  - SQS batch size
  - Lambda reserved concurrency
  - worker CPU/memory
- Add caching:
  - CloudFront for public thumbnails/HLS
  - cache headers based on request path and asset immutability
  - optional DynamoDB/DAX/ElastiCache comparison notes, not necessarily implementation

AWS practicals:

- CloudWatch Logs Insights.
- Custom metrics and dashboards.
- X-Ray traces and annotations.
- HTTP error diagnosis.
- SDK exception handling.
- Caching and concurrency tradeoffs.

## Minimal Feature Milestones

### Milestone 1: Local Next.js + Node Skeleton

- Move toward `apps/web`.
- Create `packages/core`.
- Mock AWS adapters in memory.
- Prove create upload session, upload status transitions, and video list without AWS.

### Milestone 2: Real S3 Multipart Upload

- Add AWS SDK S3 presigning.
- Browser uploads directly to S3.
- Complete multipart upload through Node code.
- Store upload state in DynamoDB.

### Milestone 3: Queue And Worker

- Send SQS message after upload completion.
- Process one queued video.
- Update status and processing run records.
- Add DLQ and retry notes.

### Milestone 4: Auth And Least Privilege

- Add Cognito.
- Enforce ownership in all reads/mutations.
- Replace local secrets with AWS config/secrets.
- Review IAM permissions per runtime.

### Milestone 5: Deployable AWS Lab

- Add SAM/CDK stack.
- Deploy dev environment.
- Add test events and deployment notes.
- Add one rollback/canary exercise.

### Milestone 6: Observability And Optimization

- Add structured logs, metrics, traces, health checks.
- Build a small operational dashboard.
- Run failure drills and document log queries.

## What To Avoid In The Minimal Rebuild

- Do not port Laravel one-to-one.
- Do not rebuild Spatie Media Library behavior; S3 object keys plus DynamoDB metadata are enough.
- Do not store one database row per HLS segment.
- Do not build complex multi-tenant billing/admin features.
- Do not start with microservices. Keep one deployable app plus one worker until AWS service boundaries require more.
- Do not spend early time on advanced networking. VPC design is mostly outside the DVA target candidate scope.

## Practical Exam Checklist

For every feature, capture four things in `docs/exam-practicals/`:

- What AWS service was used.
- What failure mode was tested.
- What logs/metrics prove it worked.
- Which DVA domain/task it maps to.

Example:

```text
Feature: Complete multipart upload
AWS services: S3, DynamoDB, SQS, IAM, CloudWatch
Failure drill: duplicate completion request
Expected behavior: conditional write prevents duplicate queue message
Exam mapping: Domain 1 idempotency, S3, messaging; Domain 4 logs/metrics
```

## Recommended First Action

Start with Milestone 1 and Milestone 2:

1. Create `packages/core` with statuses, types, validation, and state transitions.
2. Create a new minimal Next.js upload flow that calls mocked adapters.
3. Replace mocks with S3 multipart presigning and DynamoDB persistence.
4. Only then add SQS/worker processing.

This sequence gives quick feedback while moving directly into the highest-weight exam domain.
