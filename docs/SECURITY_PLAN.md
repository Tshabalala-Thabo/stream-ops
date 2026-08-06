# Security Plan

## Goals

- Authenticate users with Cognito.
- Authorize every creator resource by owner.
- Use least-privilege IAM.
- Encrypt data at rest and in transit.
- Keep secrets out of code and logs.

## Authentication

- Use Cognito User Pool for sign-in.
- Validate JWTs in Next.js server code and Lambda handlers.
- Store Cognito subject as `ownerId`.

## Authorization

- Every user-owned item must include `ownerId`.
- Every mutation must check the authenticated `ownerId`.
- Public reads should expose only `ready` videos and non-sensitive fields.

## IAM

Separate runtime roles:

- Web/API role
- Lambda role
- Worker role
- Deployment role

Policy artifacts:

- `infra/iam/streamops-deployer-policy.json`
- `infra/iam/streamops-web-runtime-policy.json`
- `docs/PHASE_4_IAM_GUIDE.md`

Avoid broad permissions:

- No `s3:*`
- No `dynamodb:*`
- No unnecessary cross-resource access

## Encryption

- Use HTTPS for all app and AWS service calls.
- Enable S3 server-side encryption.
- Use DynamoDB encryption.
- Practice KMS key rotation.

## Secrets And Config

- Use environment variables only for non-sensitive config.
- Store non-secret runtime config in SSM Parameter Store under `/streamops/dev/*`.
- Use Secrets Manager for secrets.
- Use Parameter Store or AppConfig for environment-specific config.

## Log Safety

Never log:

- JWTs
- Refresh tokens
- Cookies
- AWS credentials
- Presigned URLs
- Raw secrets

Prefer correlation IDs, video IDs, and upload session IDs.

Implemented sanitizer:

- `packages/core/src/log-sanitizer.ts`
- `apps/web/lib/logging.ts`
- `docs/PHASE_4_LOG_SANITIZATION_GUIDE.md`
