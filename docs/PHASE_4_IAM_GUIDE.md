# Phase 4 IAM Guide

This guide covers the production least-privilege IAM checkpoint.

## What Was Added

Policy artifacts:

```text
infra/iam/streamops-deployer-policy.json
infra/iam/streamops-web-runtime-policy.json
```

Validation script:

```text
scripts/validate-iam-policies.ts
```

NPM command:

```bash
npm run iam:policies:validate
```

## Training Focus

- Runtime policies and deployment policies should be separate.
- Deployment access is broader because CloudFormation creates and updates infrastructure.
- Runtime access should only include data-plane actions the app actually calls.
- DynamoDB transactions are authorized through the underlying `PutItem`, `UpdateItem`, `DeleteItem`, and `GetItem` actions, not a `TransactWriteItems` IAM action.
- S3 multipart upload uses `s3:PutObject` for create/upload/complete and `s3:AbortMultipartUpload` for abort.
- Prefer customer managed policies over oversized inline policies for deployer users or CI roles.

## Policy Responsibilities

`streamops-deployer-policy.json` is for the deployment principal.

Use it for:

- Your SAM deploy IAM user during training.
- A future CI/CD deployment role.

It allows:

- CloudFormation access to the `streamops-dev` stack.
- SAM artifact bucket reads/writes.
- StreamOps S3 bucket, DynamoDB table, SQS queues, Lambda function, Cognito user pool, IAM role, and CloudWatch Logs management.

`streamops-web-runtime-policy.json` is for the web/API runtime principal.

Use it for:

- A future Amplify, App Runner, ECS, or server runtime role.
- Local development when `sdk-user` runs the Next.js app through AWS credentials.

It allows:

- DynamoDB reads/writes only on the StreamOps workflow table.
- S3 source upload access only under `source/*`.
- S3 generated playback reads only under `generated/*`.
- SQS send access only to the processing queue.
- SSM read access only under `/streamops/dev/*`.

## Attach The Web Runtime Policy For Local Development

If your local Next.js app uses `sdk-user` credentials, attach the web runtime policy to `sdk-user` too.

Recommended console path:

```text
IAM > Policies > Create policy > JSON
```

Paste:

```text
infra/iam/streamops-web-runtime-policy.json
```

Suggested name:

```text
StreamOpsDevWebRuntimePolicy
```

Attach it to:

```text
sdk-user
```

Expected outcome:

- Local dashboard reads can call `dynamodb:Query`.
- Local uploads can call `dynamodb:PutItem`, S3 multipart upload actions, and `sqs:SendMessage`.
- `sdk-user` still does not need `AdministratorAccess`.

CLI alternative:

```bash
aws iam create-policy \
  --policy-name StreamOpsDevWebRuntimePolicy \
  --policy-document file://infra/iam/streamops-web-runtime-policy.json
```

Then attach the returned policy ARN:

```bash
aws iam attach-user-policy \
  --user-name sdk-user \
  --policy-arn arn:aws:iam::086769945536:policy/StreamOpsDevWebRuntimePolicy
```

Expected outcome:

```text
No output means attach succeeded.
```

## Validate Locally

Run:

```bash
npm run iam:policies:validate
```

Expected outcome:

```text
infra/iam/streamops-deployer-policy.json OK
infra/iam/streamops-web-runtime-policy.json OK
```

## Validate With AWS Access Analyzer

Run:

```bash
aws accessanalyzer validate-policy \
  --region af-south-1 \
  --policy-document file://infra/iam/streamops-deployer-policy.json \
  --policy-type IDENTITY_POLICY
```

Expected outcome:

```json
{
  "findings": []
}
```

Run:

```bash
aws accessanalyzer validate-policy \
  --region af-south-1 \
  --policy-document file://infra/iam/streamops-web-runtime-policy.json \
  --policy-type IDENTITY_POLICY
```

Expected outcome:

```json
{
  "findings": []
}
```

## Attach The Deployer Policy

Recommended console path:

```text
IAM > Policies > Create policy > JSON
```

Paste:

```text
infra/iam/streamops-deployer-policy.json
```

Suggested name:

```text
StreamOpsDevDeployerPolicy
```

Attach it to:

```text
sdk-user
```

Expected outcome:

- `sdk-user` can run `sam deploy` for the StreamOps stack.
- `sdk-user` does not need `AdministratorAccess`.
- `sdk-user` remains scoped to StreamOps resources in `af-south-1`.

CLI alternative:

```bash
aws iam create-policy \
  --policy-name StreamOpsDevDeployerPolicy \
  --policy-document file://infra/iam/streamops-deployer-policy.json
```

Then attach the returned policy ARN:

```bash
aws iam attach-user-policy \
  --user-name sdk-user \
  --policy-arn arn:aws:iam::086769945536:policy/StreamOpsDevDeployerPolicy
```

Expected outcome:

```text
No output means attach succeeded.
```

## Completion Evidence

Verified:

```text
npm run iam:policies:validate
-> both policy JSON files passed local validation.

aws accessanalyzer validate-policy ... streamops-deployer-policy.json
-> findings: []

aws accessanalyzer validate-policy ... streamops-web-runtime-policy.json
-> findings: []

npm run sam:validate
-> infra/sam/template.yaml is a valid SAM template.
```

`Add production least-privilege IAM policies` is complete when these policy artifacts exist, validate cleanly, and the deployer policy can be attached as a customer managed policy instead of an oversized inline policy.
