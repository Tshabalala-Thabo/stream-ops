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
apps/worker/dist/lambda.js
apps/worker/dist/package.json
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

## Deployment Test Events

These tests focus on the Lambda/SQS deployment contract:

- Direct Lambda invocation proves the deployed handler starts, receives SQS-shaped JSON, and returns the correct partial batch response.
- SQS handoff proves the deployed event source mapping receives queue messages without running the local worker.
- CloudWatch logs prove which message ID, video ID, and processing run ID reached the worker.

### Test Event Files

```text
infra/sam/events/sqs-unsupported-message.json
infra/sam/events/sqs-poison-processing-message.json
```

### Direct Lambda: Unsupported Message

Run from an AWS-authenticated terminal:

```bash
npm run sam:test:worker:unsupported
```

Expected outcome:

```json
{"batchItemFailures":[]}
```

Important training focus:

- Unsupported SQS records should not be retried.
- The Lambda handler returns an empty `batchItemFailures` array so Lambda treats the record as successful.

### Direct Lambda: Poison Processing Message

Run:

```bash
npm run sam:test:worker:poison
```

Expected outcome:

```json
{"batchItemFailures":[{"itemIdentifier":"deployment-test-poison-message"}]}
```

Important training focus:

- `ReportBatchItemFailures` is the Lambda/SQS contract for partial batch retry.
- The poison event uses a missing `videoId`, so DynamoDB returns `video_not_found`.
- The response tells Lambda which SQS message should be retried.

Expected CloudWatch log fields:

```text
event=worker.processing.started
videoId=deployment-test-missing-video
processingRunId=deployment-test-missing-run
sqsMessageId=deployment-test-poison-message
errorCode=video_not_found
```

Verified deployment evidence:

```text
npm run sam:test:worker:unsupported
-> {"batchItemFailures":[]}

npm run sam:test:worker:poison
-> {"batchItemFailures":[{"itemIdentifier":"deployment-test-poison-message"}]}
```

### Real SQS Handoff

Make sure the local worker is not running, then send one poison queue message:

```bash
npm run worker:poison
```

Expected outcome:

```text
Poison processing message sent.
```

Then inspect the source queue:

```bash
aws sqs get-queue-attributes \
  --region af-south-1 \
  --queue-url "$STREAMOPS_PROCESSING_QUEUE_URL" \
  --attribute-names ApproximateNumberOfMessages ApproximateNumberOfMessagesNotVisible
```

Expected outcome shortly after send:

```text
ApproximateNumberOfMessagesNotVisible is 1
```

or both counts return to `0` if Lambda has already consumed and retried/redriven the message.

Check Lambda logs:

```bash
aws logs tail "/aws/lambda/streamops-dev-worker" \
  --region af-south-1 \
  --since 10m
```

Expected outcome:

```text
worker.processing.started
worker.processing.workflow_error
video_not_found
```

Verified SQS handoff evidence:

```text
poison-video-1785937396350 reached /aws/lambda/streamops-dev-worker from SQS.
```

Important training focus:

- Queue messages become Lambda invocations through the event source mapping.
- Visibility timeout and `maxReceiveCount` control retries and DLQ movement.
- CloudWatch logs are the evidence that the deployed worker, not the local worker, handled the message.

## Rollback Practice

This drill practices Lambda version and alias rollback without breaking the active SQS event source mapping. The production queue still invokes the stack-managed worker function, while the drill uses a separate alias named `rollback-practice`.

Important training focus:

- Lambda published versions are immutable snapshots.
- Aliases are movable pointers to versions.
- A rollback can be as small as pointing an alias back to the last known-good version.
- CloudFormation/SAM rollback and Lambda alias rollback solve different deployment problems.

### 1. Publish A Known-Good Snapshot

```bash
npm run sam:rollback -- snapshot
```

Expected outcome:

```text
Published streamops-dev-worker version <N>.
Alias rollback-practice now points to version <N>.
CodeSha256=<hash>
```

Record `<N>` as the known-good version.

### 2. Prove The Alias Works

```bash
npm run sam:rollback:test
```

Expected outcome:

```json
{"batchItemFailures":[]}
```

This invokes `streamops-dev-worker:rollback-practice` with the unsupported-message event. Empty `batchItemFailures` proves the alias points at a working handler.

### 3. Publish A Second Snapshot

After any future worker deployment, publish another snapshot:

```bash
npm run sam:rollback -- snapshot
```

Expected outcome:

```text
Published streamops-dev-worker version <M>.
Alias rollback-practice now points to version <M>.
```

Record `<M>` as the candidate version.

### 4. Roll Back The Alias

Move the alias back to the known-good version from step 1:

```bash
npm run sam:rollback -- point-alias --version <N>
```

Expected outcome:

```text
Alias rollback-practice now points to version <N>.
```

Verify:

```bash
npm run sam:rollback -- show-alias
npm run sam:rollback:test
```

Expected outcome:

```text
Alias rollback-practice points to version <N>.
```

and:

```json
{"batchItemFailures":[]}
```

Evidence for the checklist:

- A Lambda version was published.
- `rollback-practice` alias was created or moved.
- Alias-targeted test invocation succeeded.

Verified rollback evidence:

```text
npm run sam:rollback -- snapshot
-> Published streamops-dev-worker version 1.
-> Alias rollback-practice now points to version 1.

npm run sam:rollback:test
-> ExecutedVersion: 1
-> {"batchItemFailures":[]}

npm run sam:rollback -- point-alias --version 1
-> Alias rollback-practice now points to version 1.
```
