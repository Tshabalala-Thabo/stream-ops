# Phase 5 SAM Guide

The initial SAM stack lives at:

```text
infra/sam/template.yaml
```

It provisions stack-managed dev resources instead of adopting the earlier manually created AWS resources:

- S3 storage bucket with private access, AES256 encryption, CORS, and incomplete multipart cleanup.
- DynamoDB workflow table with `PK`/`SK` keys, on-demand billing, encryption, and `ttl` expiry.
- SQS processing queue.
- SQS dead-letter queue.
- Worker Lambda wired to the processing queue.
- Least-privilege worker permissions for DynamoDB, S3 source reads, S3 generated asset writes/reads, and SQS consumption.

## Local Build

Build the worker Lambda bundle before SAM build/deploy:

```bash
npm run worker:lambda:build
```

Expected output:

```text
apps/worker/dist/lambda.mjs
```

## SAM Validate

Install AWS SAM CLI if it is not available locally, then run:

```bash
npm run sam:validate
```

Expected outcome:

```text
infra/sam/template.yaml is a valid SAM Template
```

If SAM cannot write its metadata under your home directory in a restricted shell, run with a writable temporary home:

```bash
env HOME=/private/tmp/streamops-sam-home SAM_CLI_TELEMETRY=0 npm run sam:validate
```

## SAM Build

```bash
npm run sam:build
```

Expected outcome:

```text
Build Succeeded
```

Restricted-shell variant:

```bash
env HOME=/private/tmp/streamops-sam-home SAM_CLI_TELEMETRY=0 npm run sam:build
```

## Guided Dev Deploy

The worker calls `ffmpeg` and `ffprobe`. Provide a Lambda layer ARN that contains both binaries before deploying a processing-capable worker.

```bash
sam deploy \
  --guided \
  --template-file infra/sam/template.yaml \
  --parameter-overrides \
    ProjectName=streamops \
    EnvironmentName=dev \
    FfmpegLayerArn=arn:aws:lambda:af-south-1:ACCOUNT_ID:layer:LAYER_NAME:VERSION
```

Expected stack outputs:

- `SourceBucketName`
- `WorkflowTableName`
- `ProcessingQueueUrl`
- `ProcessingDeadLetterQueueUrl`
- `WorkerFunctionName`

Use those outputs for the deployed app environment variables:

```text
AWS_REGION=af-south-1
STREAMOPS_TABLE_NAME=<WorkflowTableName>
STREAMOPS_SOURCE_BUCKET=<SourceBucketName>
STREAMOPS_PROCESSING_QUEUE_URL=<ProcessingQueueUrl>
STREAMOPS_PROCESSING_DLQ_URL=<ProcessingDeadLetterQueueUrl>
```

## Current Limitation

The template is ready for validation/build, but deployed video processing requires an FFmpeg Lambda layer or a future container-based Lambda package. Without that layer, the Lambda can receive messages but media processing will fail when it tries to execute `ffprobe` or `ffmpeg`.

## Pull Stack Outputs Into Local Env

After a successful deploy, update local app/worker development config from CloudFormation outputs:

```bash
npm run sam:env:pull
```

Defaults:

```text
stack-name=streamops-dev
region=af-south-1
env-file=apps/web/.env.local
```

Override those defaults when needed:

```bash
npm run sam:env:pull -- --stack-name streamops-dev --region af-south-1 --env-file apps/web/.env.local
```

The script preserves unrelated env vars such as `AWS_PROFILE`, sets `WORKFLOW_STORE=aws`, and updates:

```text
AWS_REGION
STREAMOPS_TABLE_NAME
STREAMOPS_SOURCE_BUCKET
STREAMOPS_PROCESSING_QUEUE_URL
STREAMOPS_PROCESSING_DLQ_URL
```

Verify without printing credentials:

```bash
awk -F= '/^(AWS_REGION|AWS_PROFILE|WORKFLOW_STORE|STREAMOPS_TABLE_NAME|STREAMOPS_SOURCE_BUCKET|STREAMOPS_PROCESSING_QUEUE_URL|STREAMOPS_PROCESSING_DLQ_URL)=/ { print $1"=<set>" }' apps/web/.env.local
```
