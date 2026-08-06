# Phase 4 Log Sanitization Guide

This guide covers the final Phase 4 security checkpoint.

## What Was Added

Shared sanitizer:

```text
packages/core/src/log-sanitizer.ts
packages/core/src/log-sanitizer.test.ts
```

Web logging:

```text
apps/web/lib/logging.ts
apps/web/app/api/auth/session/route.ts
apps/web/app/auth/callback/route.ts
apps/web/lib/workflow/http.ts
apps/web/app/api/playback/[videoId]/hls/[...assetPath]/route.ts
```

Worker logging:

```text
apps/worker/src/index.ts
apps/worker/src/lambda.ts
apps/worker/src/processor.ts
```

## Training Focus

- Logs should be useful for operations without exposing secrets.
- Never log JWTs, refresh tokens, cookies, authorization headers, AWS credentials, or presigned URLs.
- Keep stable operational identifiers such as `videoId`, `ownerId`, `processingRunId`, `sqsMessageId`, and error codes.
- Prefer structured JSON logs so CloudWatch Logs Insights can query fields.
- Store sanitized error summaries, not raw Error objects with arbitrary SDK/request metadata.

## Redaction Rules

The sanitizer redacts sensitive keys including:

```text
authorization
cookie
token
secret
password
credential
signature
presigned
set-cookie
x-amz-security-token
```

It also redacts string values that look like signed URLs or token query strings, including:

```text
X-Amz-Signature=
X-Amz-Credential=
X-Amz-Security-Token=
access_token=
id_token=
refresh_token=
```

Long strings are truncated to keep logs bounded.

## Expected Outcomes

Auth failures log only safe fields:

```json
{"level":"warn","event":"auth.session.rejected","errorCode":"auth_token_required"}
```

Workflow failures log only safe fields:

```json
{"level":"warn","event":"workflow.request.rejected","errorCode":"video_not_found"}
```

Worker processing failures log safe context:

```json
{
  "level": "error",
  "event": "worker.processing.failed",
  "videoId": "...",
  "ownerId": "...",
  "processingRunId": "...",
  "sqsMessageId": "...",
  "error": {
    "name": "Error",
    "message": "[REDACTED]"
  }
}
```

## Verification

Run:

```bash
npm run test --workspaces --if-present
npm run typecheck
```

Expected outcome:

```text
sanitizer tests pass
all workspaces pass typecheck
```

## Completion Evidence

Verified:

```text
npm run test --workspaces --if-present
-> 9 tests passed, including sanitizer redaction tests.

npm run typecheck
-> @streamops/web, @streamops/worker, @streamops/aws, and @streamops/core passed.
```

`Add log sanitization` is complete.
