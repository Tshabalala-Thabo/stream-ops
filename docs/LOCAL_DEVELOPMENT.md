# Local Development

## Goal

Keep the first local setup simple. Start with mocks, then add AWS services deliberately.

## Prerequisites

- Node.js 20 or newer
- npm
- AWS CLI
- Docker, only when local service emulation or worker containers are introduced

## First Local Mode

Use in-memory adapters for:

- Videos
- Upload sessions
- Processing queue
- Processing runs

This keeps the first milestone focused on domain behavior and UI flow.

## AWS Local Mode

After the domain skeleton works:

- Use a real AWS dev account for S3 multipart upload.
- Use DynamoDB in AWS or DynamoDB Local.
- Use SQS in AWS for queue practice.

Prefer real AWS services for DVA practice because the exam is about AWS service behavior, permissions, and operational signals.

## Environment Variables

Expected later:

```text
AWS_REGION=
AWS_PROFILE=
STREAMOPS_TABLE_NAME=
STREAMOPS_SOURCE_BUCKET=
STREAMOPS_PLAYBACK_BUCKET=
STREAMOPS_PROCESSING_QUEUE_URL=
STREAMOPS_PROCESSING_DLQ_URL=
COGNITO_USER_POOL_ID=
COGNITO_CLIENT_ID=
```

Do not store secrets in `.env` once Secrets Manager or Parameter Store is introduced.

