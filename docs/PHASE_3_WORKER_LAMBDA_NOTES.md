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

It downloads the source video from S3, runs `ffprobe`, generates a JPEG thumbnail, and generates adaptive HLS renditions with `ffmpeg`.

The current HLS ladder is:

```text
1080p when the source's shorter edge is at least 1080 pixels
720p when the source's shorter edge is at least 720 pixels
480p when the source's shorter edge is at least 480 pixels
```

For example, a 1280x720 landscape source or a 720x1280 portrait source should produce 720p and 480p renditions. A 1920x1080 landscape source or a 1080x1920 portrait source should produce 1080p, 720p, and 480p renditions.

It writes generated assets to:

```text
generated/{ownerId}/{videoId}/thumbnail.jpg
generated/{ownerId}/{videoId}/hls/master.m3u8
generated/{ownerId}/{videoId}/hls/1080p/index.m3u8
generated/{ownerId}/{videoId}/hls/720p/index.m3u8
generated/{ownerId}/{videoId}/hls/480p/index.m3u8
generated/{ownerId}/{videoId}/hls/{rendition}/segment-000.ts
```

It persists the video metadata and rendition record in DynamoDB.

## Playback Proxy

The web app serves private HLS playback through:

```text
/api/playback/{videoId}/hls/master.m3u8
/api/playback/{videoId}/hls/{rendition}/index.m3u8
/api/playback/{videoId}/hls/{rendition}/segment-000.ts
```

The proxy reads generated HLS files from S3, rewrites playlist references back through the app, and lets the video detail page play the stream without making the S3 bucket public.

The SDK user or deployed web runtime role needs this additional permission:

```json
{
  "Sid": "StreamOpsS3PlaybackReadPhase3",
  "Effect": "Allow",
  "Action": [
    "s3:GetObject"
  ],
  "Resource": "arn:aws:s3:::streamops-dev-storage/generated/*"
}
```

## DLQ Failure Drill

The main processing queue redrive policy targets:

```text
arn:aws:sqs:af-south-1:086769945536:streamops-dev-processing-dlq
```

The configured `maxReceiveCount` is `3`, so a failing message must be received and fail several times before SQS moves it to the DLQ.

Local environment variable:

```text
STREAMOPS_PROCESSING_DLQ_URL=https://sqs.af-south-1.amazonaws.com/086769945536/streamops-dev-processing-dlq
```

Send an intentional poison message:

```bash
npm run worker:poison
```

Process the queue until the poison message reaches the redrive threshold:

```bash
npm run worker:once
```

The local worker must fail the poison message and leave it undeleted. After SQS visibility timeout/retry cycles and the `maxReceiveCount` threshold, inspect the DLQ:

```bash
npm run worker:dlq:peek
```

Expected result:

```text
DLQ contains 1 visible message(s).
```

The SDK user needs read access to inspect the DLQ:

```json
{
  "Sid": "StreamOpsSqsDlqInspectPhase3",
  "Effect": "Allow",
  "Action": [
    "sqs:ReceiveMessage",
    "sqs:GetQueueAttributes"
  ],
  "Resource": "arn:aws:sqs:af-south-1:086769945536:streamops-dev-processing-dlq"
}
```

## Required Lambda Environment Variables

```text
AWS_REGION=
STREAMOPS_TABLE_NAME=
STREAMOPS_SOURCE_BUCKET=
STREAMOPS_PROCESSING_QUEUE_URL=
STREAMOPS_PROCESSING_DLQ_URL=
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
