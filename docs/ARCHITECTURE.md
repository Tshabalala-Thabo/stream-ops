# Architecture

StreamOps AWS is a small video workflow application built to practice AWS developer tasks.

## Design Principles

- Keep application code in Next.js and plain Node.js/TypeScript.
- Prefer AWS managed services over local framework abstractions.
- Keep service boundaries small and explicit.
- Make every workflow idempotent.
- Treat logs, metrics, and traces as first-class deliverables.

## Runtime Boundaries

```text
Next.js
  - UI pages
  - authenticated dashboard
  - upload orchestration
  - server-side reads
  - route handlers for app APIs

Node packages
  - domain types
  - validation
  - state transitions
  - AWS SDK adapters
  - observability helpers

AWS compute
  - Lambda for lightweight handlers
  - optional worker container for FFmpeg-heavy processing
```

## Core Workflow

1. User signs in with Cognito.
2. User creates an upload session.
3. App creates a video record and S3 multipart upload.
4. Browser uploads parts directly to S3.
5. App completes the multipart upload.
6. App stores workflow state in DynamoDB.
7. App sends a processing message to SQS.
8. Worker processes the video and writes generated assets to S3.
9. Worker updates status, emits logs, metrics, and traces.
10. Next.js shows ready videos and processing history.

## Minimal AWS Architecture

```text
Cognito User Pool
       |
       v
Next.js App
       |
       +--> DynamoDB: videos, upload sessions, runs, renditions
       +--> S3: source videos, thumbnails, HLS manifests, segments
       +--> SQS: processing jobs
       +--> DLQ: failed processing messages
       +--> Lambda: presign, complete, event handlers
       +--> CloudWatch: logs and metrics
       +--> X-Ray: traces
```

## Intentional Non-Goals

- No Laravel/PHP port.
- No custom microservice platform.
- No row per HLS segment.
- No advanced VPC/networking design in the first version.
- No complex admin or billing domain.
