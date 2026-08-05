# StreamOps AWS

StreamOps AWS is a minimal Next.js + Node.js rebuild of the original StreamOps video pipeline, designed as a practical study project for the AWS Certified Developer - Associate exam.

The goal is not to rebuild every feature from the Laravel version. The goal is to practice AWS developer skills with a focused application:

- Authenticated creator upload flow
- Direct browser-to-S3 multipart uploads
- DynamoDB-backed workflow state
- SQS-based asynchronous processing
- Node.js worker/Lambda handlers
- S3-hosted generated video assets
- CloudWatch logs, metrics, traces, and failure drills

## Exam Focus

The project is organized around the current DVA-C02 domains:

- Development with AWS Services: 32%
- Security: 26%
- Deployment: 24%
- Troubleshooting and Optimization: 18%

See [docs/AWS_DVA_STUDY_MAP.md](docs/AWS_DVA_STUDY_MAP.md) for the feature-to-exam mapping.

## Target Stack

- Next.js App Router
- React
- Node.js
- TypeScript
- AWS SDK for JavaScript v3
- Amazon S3
- Amazon DynamoDB
- Amazon SQS with DLQ
- AWS Lambda
- Amazon Cognito
- IAM, KMS, Secrets Manager, Parameter Store/AppConfig
- Amazon CloudWatch and AWS X-Ray
- AWS SAM for infrastructure

## Minimal Architecture

```text
Browser
  |
  v
Next.js App
  |
  v
Node/TypeScript domain logic
  |
  +--> Cognito
  +--> S3
  +--> DynamoDB
  +--> SQS + DLQ
  +--> Lambda
  +--> Optional Node worker for FFmpeg
  +--> CloudWatch + X-Ray
```

## Planned Repo Shape

```text
apps/
  web/                  # Next.js application; deploy to Amplify Hosting, App Runner, ECS, or Elastic Beanstalk
  worker/               # Node.js SQS/FFmpeg worker; deploy to Lambda, ECS/Fargate, or App Runner
packages/
  core/                 # shared domain types, validation, state transitions; imported by apps and handlers
  aws/                  # shared AWS SDK adapters for S3, DynamoDB, SQS, Cognito, and config
  observability/        # shared logs, metrics, traces, and correlation helpers
infra/
  sam/                  # provisions S3, DynamoDB, SQS/DLQ, Lambda, Cognito, IAM, CloudWatch, and X-Ray
docs/
  *.md                  # architecture and study notes
```

This is a monorepo for one application with multiple deployment targets. `apps/web`,
`apps/worker`, Lambda handlers, and `infra` can be deployed independently when their
part of the system changes. The shared `packages/*` directories are not standalone
microservices; they are reusable TypeScript libraries consumed by the deployable
apps and handlers.

Expected deployment splits:

```text
apps/web
  -> Amplify Hosting for the simplest Next.js deployment
  -> or a standalone Next.js container on App Runner, ECS, or Elastic Beanstalk

apps/worker
  -> Lambda for lightweight queue handlers
  -> or ECS/Fargate/App Runner for FFmpeg-heavy processing

infra/sam
  -> CloudFormation-managed AWS resources and environment configuration

S3
  -> source uploads, generated thumbnails, HLS manifests, and video segments

DynamoDB
  -> videos, upload sessions, processing runs, and renditions

SQS + DLQ
  -> asynchronous processing jobs and failed-message redrive practice

Cognito
  -> sign-up, sign-in, JWT issuer, and creator identity
```

## First Milestone

Build the upload workflow with mocked AWS adapters first:

1. Define domain types and workflow states.
2. Create upload sessions.
3. Simulate multipart upload completion.
4. Queue a processing message.
5. Show video status in the dashboard.

After that, replace the mocks with real S3 multipart upload, DynamoDB persistence, and SQS.

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [AWS DVA Study Map](docs/AWS_DVA_STUDY_MAP.md)
- [Rebuild Phases](docs/REBUILD_PHASES.html)
- [Domain Model](docs/DOMAIN_MODEL.md)
- [Acceptance Scenarios](docs/ACCEPTANCE_SCENARIOS.md)
- [AWS Services](docs/AWS_SERVICES.md)
- [Security Plan](docs/SECURITY_PLAN.md)
- [Deployment Plan](docs/DEPLOYMENT_PLAN.md)
- [Observability Plan](docs/OBSERVABILITY_PLAN.md)
- [Local Development](docs/LOCAL_DEVELOPMENT.md)
