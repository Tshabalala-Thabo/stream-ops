# Deployment Plan

## Goal

Deploy a minimal AWS environment repeatedly and safely.

## Infrastructure

Use AWS SAM.

Initial resources:

- S3 source bucket
- S3 public/playback bucket or prefix
- DynamoDB table
- SQS processing queue
- SQS dead-letter queue
- Lambda handlers
- Cognito User Pool
- CloudWatch log groups
- IAM roles and policies

## Environments

Start with:

- `dev`
- `test`

Add `prod` only after the workflow is stable.

## Next.js Deployment Options

Option A: AWS Amplify Hosting.

- Best first option for simplicity.
- Good for learning environment config and branch deployments.

Option B: Standalone Next.js container.

- Use `output: "standalone"`.
- Deploy to ECS, App Runner, or Elastic Beanstalk.
- Better for container and deployment-strategy practice.

## Deployment Practicals

- Build and package Lambda handlers.
- Deploy stack updates.
- Use Lambda aliases.
- Test a canary or rollback.
- Run integration test events.
- Promote environment-specific config.
- Inspect deployment failure logs.

## CI/CD Later

After manual deployment works:

- Add CodeBuild.
- Add CodePipeline.
- Add manual approval before production.
- Add test and deployment stages.
