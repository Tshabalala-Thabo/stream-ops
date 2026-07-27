# AWS DVA-C02 Study Map

This project is organized around practical coverage of the AWS Certified Developer - Associate domains.

## Domain 1: Development With AWS Services, 32%

Project features:

- S3 multipart upload
- Presigned URLs
- DynamoDB workflow state
- SQS processing queue
- DLQ failure handling
- EventBridge lifecycle events
- Lambda handlers in Node.js
- AWS SDK for JavaScript v3
- Idempotent upload completion and processing

Practical drills:

- Retry a failed upload part.
- Complete the same upload twice and prevent duplicate processing.
- Send a malformed SQS message and route it to DLQ.
- Compare DynamoDB query and scan behavior.
- Add TTL to expired upload sessions.

## Domain 2: Security, 26%

Project features:

- Cognito User Pool authentication
- JWT bearer token validation
- Owner-based authorization
- Least-privilege IAM roles
- KMS encryption
- Secrets Manager or Parameter Store configuration
- Sanitized structured logs

Practical drills:

- Deny access to another user's video.
- Rotate a secret or parameter.
- Compare AWS managed and customer-managed KMS keys.
- Review a role policy and remove wildcard permissions.
- Verify tokens are not written to logs.

## Domain 3: Deployment, 24%

Project features:

- AWS SAM infrastructure
- Environment-specific config
- Lambda packaging
- SQS, DynamoDB, S3, Cognito provisioning
- Deployment test events
- Optional CodeBuild/CodePipeline workflow
- Lambda alias or canary deployment practice

Practical drills:

- Deploy dev and test environments.
- Run Lambda test events.
- Roll back a broken handler version.
- Promote a container tag for the worker.
- Validate infrastructure changes before deploy.

## Domain 4: Troubleshooting And Optimization, 18%

Project features:

- Structured JSON logs
- CloudWatch EMF custom metrics
- CloudWatch Logs Insights queries
- X-Ray traces and annotations
- Health and readiness endpoints
- SQS message age monitoring
- Upload and processing duration metrics
- CloudFront/cache header exercises

Practical drills:

- Find a failed upload by correlation ID.
- Query processing failures by video ID.
- Detect high SQS message age.
- Tune worker concurrency.
- Compare Lambda memory settings.
- Cache immutable HLS assets correctly.

## Study Rule

Every implemented feature should have:

- The AWS service used.
- The failure mode tested.
- The logs or metrics that prove the behavior.
- The DVA domain and task it maps to.
