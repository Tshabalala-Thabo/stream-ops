# Phase 3 Worker And Lambda Notes

Phase 3 currently supports two worker entry points:

```text
apps/worker/src/index.ts
apps/worker/src/lambda.ts
```

## Local Worker

The local worker polls SQS directly:

```bash
npm run worker
npm run worker:once
```

Use `worker:once` while developing because it processes at most one received message and then exits.

## Lambda Handler

The Lambda-ready SQS handler is:

```text
apps/worker/src/lambda.ts
```

Handler export:

```text
handler
```

Future SAM handler target after bundling:

```text
apps/worker/src/lambda.handler
```

The Lambda handler expects an SQS event. It parses each record body as a `PROCESS_VIDEO` message. Unsupported messages are ignored successfully so Lambda can delete them. Failed processing messages are returned in `batchItemFailures` so SQS can retry them and eventually send them to the DLQ.

## Current Processing Behavior

The worker is intentionally lightweight. It does not run FFmpeg yet.

Current behavior:

```text
queued -> processing -> ready
```

It downloads the source video from S3, runs `ffprobe`, generates a JPEG thumbnail, and generates a single 720p HLS rendition with `ffmpeg`.

It writes generated assets to:

```text
generated/{ownerId}/{videoId}/thumbnail.jpg
generated/{ownerId}/{videoId}/hls/master.m3u8
generated/{ownerId}/{videoId}/hls/720p/index.m3u8
generated/{ownerId}/{videoId}/hls/720p/segment-000.ts
```

It persists the video metadata and rendition record in DynamoDB.

## Required Lambda Environment Variables

```text
AWS_REGION=
STREAMOPS_TABLE_NAME=
STREAMOPS_SOURCE_BUCKET=
STREAMOPS_PROCESSING_QUEUE_URL=
```

`AWS_PROFILE` is only for local development. Do not configure `AWS_PROFILE` in Lambda.

## Required Lambda Permissions

For SQS event source mapping:

```text
sqs:ReceiveMessage
sqs:DeleteMessage
sqs:GetQueueAttributes
sqs:ChangeMessageVisibility
```

For workflow updates:

```text
dynamodb:GetItem
dynamodb:Query
dynamodb:PutItem
dynamodb:UpdateItem
dynamodb:ConditionCheckItem
```

FFmpeg/S3 asset generation requires read access to source objects and write access to generated asset keys:

```text
s3:GetObject on arn:aws:s3:::streamops-dev-storage/source/*
s3:PutObject on arn:aws:s3:::streamops-dev-storage/generated/*
```
