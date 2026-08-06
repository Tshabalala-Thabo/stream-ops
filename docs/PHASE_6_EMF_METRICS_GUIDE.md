# Phase 6 EMF Metrics Guide

This guide covers worker metrics using CloudWatch Embedded Metric Format.

## What EMF Means

EMF is CloudWatch Embedded Metric Format. The worker writes structured JSON logs with an `_aws` block, and CloudWatch turns selected fields into custom metrics.

## What Was Added

```text
apps/worker/src/emf.ts
apps/worker/src/emf.test.ts
apps/worker/src/processor.ts
infra/sam/template.yaml
```

The worker Lambda now receives:

```text
STREAMOPS_ENVIRONMENT=<EnvironmentName>
```

## Metrics

Namespace:

```text
StreamOps/Worker
```

Dimensions:

```text
Environment
Outcome
```

Metrics:

```text
ProcessingStarted
ProcessingSucceeded
ProcessingFailed
WorkflowError
ProcessingDurationMs
RenditionCount
```

## Training Focus

- Keep metric dimensions low-cardinality.
- `Environment` and `Outcome` are useful dimensions.
- Do not use `videoId`, `ownerId`, `processingRunId`, or `sqsMessageId` as metric dimensions.
- Keep IDs in logs for debugging, not in metric dimensions.
- Use metrics for rates, counts, duration, and alarms.
- Use logs for per-request or per-video investigation.

## Expected EMF Log Shape

```json
{
  "_aws": {
    "Timestamp": 1786000000000,
    "CloudWatchMetrics": [
      {
        "Namespace": "StreamOps/Worker",
        "Dimensions": [["Environment", "Outcome"]],
        "Metrics": [
          { "Name": "ProcessingSucceeded", "Unit": "Count" },
          { "Name": "ProcessingDurationMs", "Unit": "Milliseconds" }
        ]
      }
    ]
  },
  "Environment": "dev",
  "Outcome": "succeeded",
  "ProcessingSucceeded": 1,
  "ProcessingDurationMs": 42800,
  "videoId": "..."
}
```

## Deploy

Build and deploy:

```bash
npm run sam:build
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name streamops-dev \
  --region af-south-1 \
  --capabilities CAPABILITY_IAM \
  --s3-bucket streamops-dev-sam-artifacts-086769945536-af-south-1 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Expected outcome:

```text
Worker Lambda code/config updates successfully.
```

## Verify In CloudWatch

Run one worker processing test after deploy.

For a failure-path metric:

```bash
npm run worker:poison
```

Wait for Lambda to process it, or run the deployed test event if you are testing Lambda directly.

Then open:

```text
CloudWatch > Metrics > All metrics > Custom namespaces > StreamOps/Worker
```

Expected outcome:

```text
ProcessingStarted
ProcessingFailed
WorkflowError
ProcessingDurationMs
```

Metrics can take a few minutes to appear after the first EMF log event.

## Verification

Local verification:

```bash
npm run test --workspaces --if-present
npm run typecheck
npm run worker:lambda:build
npm run sam:validate
```

Expected outcome:

```text
worker EMF tests pass
all workspaces pass typecheck
Lambda bundle builds
SAM template validates
```

## Completion Evidence

Verified locally:

```text
npm run test --workspaces --if-present
-> worker EMF tests passed.

npm run typecheck
-> all workspaces passed.

npm run worker:lambda:build
-> dist/lambda.js built successfully.

npm run sam:validate
-> infra/sam/template.yaml is valid.
```
