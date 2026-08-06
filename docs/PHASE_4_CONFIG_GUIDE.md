# Phase 4 Config Guide

This guide covers moving runtime configuration to AWS-managed config.

## What Was Added

SAM now creates runtime config in SSM Parameter Store:

```text
/streamops/dev/aws-region
/streamops/dev/workflow-store
/streamops/dev/table-name
/streamops/dev/source-bucket
/streamops/dev/processing-queue-url
/streamops/dev/processing-dlq-url
/streamops/dev/cognito-user-pool-id
/streamops/dev/cognito-client-id
/streamops/dev/cognito-issuer
/streamops/dev/cognito-domain
```

Code and policy artifacts:

```text
infra/sam/template.yaml
scripts/pull-ssm-config.ts
infra/iam/streamops-deployer-policy.json
infra/iam/streamops-web-runtime-policy.json
```

NPM command:

```bash
npm run config:pull
```

## Training Focus

- Parameter Store is for non-secret runtime config.
- Secrets Manager is for real secrets such as API keys, private signing keys, and webhook secrets.
- `.env.local` becomes a local development cache, not the source of truth.
- CloudFormation owns the SSM parameters, so stack updates keep config in sync.
- Runtime IAM should read only `/streamops/dev/*`, not every parameter in the account.

## Step 1: Validate Locally

Run:

```bash
npm run sam:validate
npm run typecheck
npm run iam:policies:validate
```

Expected outcome:

```text
infra/sam/template.yaml is a valid SAM Template
all workspaces pass typecheck
infra/iam/streamops-deployer-policy.json OK
infra/iam/streamops-web-runtime-policy.json OK
```

## Step 2: Deploy SSM Parameters

Build:

```bash
npm run sam:build
```

Expected outcome:

```text
Build Succeeded
```

Deploy:

```bash
sam deploy \
  --template-file .aws-sam/build/template.yaml \
  --stack-name streamops-dev \
  --region af-south-1 \
  --capabilities CAPABILITY_IAM \
  --s3-bucket streamops-dev-sam-artifacts-086769945536-af-south-1 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset
```

Expected CloudFormation changes:

```text
AWS::SSM::Parameter CREATE_COMPLETE
```

or, on later deploys:

```text
AWS::SSM::Parameter UPDATE_COMPLETE
```

Expected wait time:

```text
1-3 minutes
```

## Step 3: Verify In AWS Console

Open:

```text
AWS Systems Manager > Parameter Store
```

Search:

```text
/streamops/dev/
```

Expected outcome:

```text
10 parameters are visible.
```

Important: these are `String` parameters, not `SecureString`, because none of the current values are secrets.

## Step 4: Pull Config To Local Env

Run:

```bash
npm run config:pull
```

Expected outcome:

```text
Updated apps/web/.env.local from SSM /streamops/dev.
AWS_REGION=<set>
WORKFLOW_STORE=<set>
STREAMOPS_TABLE_NAME=<set>
STREAMOPS_SOURCE_BUCKET=<set>
STREAMOPS_PROCESSING_QUEUE_URL=<set>
STREAMOPS_PROCESSING_DLQ_URL=<set>
COGNITO_USER_POOL_ID=<set>
COGNITO_CLIENT_ID=<set>
COGNITO_ISSUER=<set>
COGNITO_DOMAIN=<set>
```

Verify without printing values:

```bash
awk -F= '/^(AWS_REGION|WORKFLOW_STORE|STREAMOPS_TABLE_NAME|STREAMOPS_SOURCE_BUCKET|STREAMOPS_PROCESSING_QUEUE_URL|STREAMOPS_PROCESSING_DLQ_URL|COGNITO_USER_POOL_ID|COGNITO_CLIENT_ID|COGNITO_ISSUER|COGNITO_DOMAIN)=/ { print $1"=<set>" }' apps/web/.env.local
```

Expected outcome:

```text
AWS_REGION=<set>
WORKFLOW_STORE=<set>
STREAMOPS_TABLE_NAME=<set>
STREAMOPS_SOURCE_BUCKET=<set>
STREAMOPS_PROCESSING_QUEUE_URL=<set>
STREAMOPS_PROCESSING_DLQ_URL=<set>
COGNITO_USER_POOL_ID=<set>
COGNITO_CLIENT_ID=<set>
COGNITO_ISSUER=<set>
COGNITO_DOMAIN=<set>
```

## Step 5: Test The App

Run:

```bash
npm run dev -w apps/web
```

Expected outcome:

```text
Next.js starts on localhost:3000.
```

Open:

```text
http://localhost:3000/api/auth/session
```

Expected outcome after sign-in:

```json
{
  "authenticated": true,
  "ownerId": "<cognito-sub>"
}
```

Open:

```text
http://localhost:3000/api/workflow/videos
```

Expected outcome after sign-in:

```json
{
  "videos": [],
  "uploadSessions": []
}
```

or your authenticated user's workflow records.

## Completion Evidence

Mark `Move configuration to AWS-managed config/secrets` complete after:

- SAM deploy creates or updates the SSM parameters.
- AWS Console shows `/streamops/dev/*` parameters.
- `npm run config:pull` updates `apps/web/.env.local`.
- The signed-in app still loads auth and workflow endpoints.

Current evidence:

```text
sam deploy
-> completed successfully after adding AWS::SSM::Parameter runtime config resources.

npm run config:pull
-> Updated apps/web/.env.local from SSM /streamops/dev.
-> All expected runtime config variables were present.

IAM policy refinement
-> Added both parameter/streamops/dev and parameter/streamops/dev/* because GetParametersByPath authorizes the parent path too.
```

`Move configuration to AWS-managed config/secrets` is complete.
