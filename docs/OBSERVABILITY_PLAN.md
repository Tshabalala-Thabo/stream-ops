# Observability Plan

## Goals

- Diagnose failed uploads.
- Diagnose failed processing jobs.
- Measure processing duration.
- Track queue health.
- Prove behavior with logs, metrics, and traces.

## Logging

Use structured JSON logs.

Common fields:

- `timestamp`
- `level`
- `service`
- `operation`
- `correlationId`
- `userId`
- `videoId`
- `uploadSessionId`
- `processingRunId`
- `errorName`
- `errorMessage`

## Metrics

Use CloudWatch EMF custom metrics.

Initial metrics:

- `UploadSessionCreated`
- `UploadCompleted`
- `UploadFailed`
- `ProcessingStarted`
- `ProcessingCompleted`
- `ProcessingFailed`
- `ProcessingDurationMs`
- `SqsMessageAgeMs`

Implemented worker EMF metrics:

- `apps/worker/src/emf.ts`
- `docs/PHASE_6_EMF_METRICS_GUIDE.md`
- Namespace: `StreamOps/Worker`
- Dimensions: `Environment`, `Outcome`

## Tracing

Use X-Ray or explicit trace IDs across:

- Next.js request
- Lambda handler
- DynamoDB write
- SQS message
- Worker processing
- S3 asset write

## Health Checks

Expose:

- Web health endpoint
- Worker readiness check
- Queue depth check
- Dependency check for DynamoDB/S3 where useful

## Failure Drills

Document log queries for:

- Expired upload session
- Failed multipart completion
- Missing S3 object
- Duplicate completion request
- DLQ message
- FFmpeg failure
- Unauthorized access attempt
