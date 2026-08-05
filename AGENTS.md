# StreamOps Agent Instructions

## Project Purpose

StreamOps AWS is a practical AWS Certified Developer - Associate training project. Treat implementation work as both software delivery and exam practice.

Use `docs/REBUILD_PHASES.html` as the source of truth for checklist progress. Do not use or recreate `docs/REBUILD_PHASES.md`.

## Working On Checklist Items

When moving through checklist items, discuss expected outcomes whenever the work involves user-run commands, AWS Console steps, deployments, queues, IAM, authentication, observability, or other behavior that needs verification.

For those steps, include:

- The exact command or console action.
- The expected successful output or visible AWS state.
- The expected failure modes and what they usually mean.
- The resource names, IDs, queue URLs, stack names, or log fields the user should pay attention to.
- The concrete evidence that allows the checkbox to be marked complete.

Keep implementation and tracker updates separate:

- Implement or guide the work first.
- Verify with code checks, AWS output, logs, screenshots, or command output.
- Only mark `docs/REBUILD_PHASES.html` complete after the evidence exists.

## Training Focus To Highlight

While solving items, explicitly call out the AWS concepts the user should focus on for training:

- S3: multipart upload, presigned URLs, CORS, server-side encryption, lifecycle cleanup, object keys, and cache headers.
- DynamoDB: `PK`/`SK` access patterns, conditional writes, transactions, TTL, query vs scan, and idempotency.
- SQS: visibility timeout, receive count, DLQ redrive, message attributes, batch item failures, and idempotent consumers.
- Lambda: handler shape, event source mappings, timeout/memory/ephemeral storage, layers, environment variables, IAM role permissions, and CloudWatch logs.
- Cognito: user pools, app clients, JWT validation, bearer tokens, and mapping the Cognito subject to `ownerId`.
- IAM: least privilege, deployment roles vs runtime roles, `iam:PassRole`, resource scoping, and avoiding broad wildcards.
- CloudFormation/SAM: stack ownership, changesets, rollback states, stack outputs, artifact buckets, parameters, and environment promotion.
- Observability: structured JSON logs, correlation IDs, CloudWatch Logs Insights, EMF metrics, traces, alarms, and failure drills.
- Security: owner enforcement, secrets/config separation, log sanitization, encryption at rest, and avoiding token/credential leakage.

## Communication Style For Training Steps

When the user asks "what next", "proceed", or wants to move to the next checklist item, respond with a short runbook:

1. Current checklist item.
2. Why it matters for the AWS/DVA training goal.
3. Precise steps.
4. Expected outcomes.
5. What evidence will update the tracker.

If there are multiple valid approaches, discuss tradeoffs before choosing one. Prefer the approach that keeps AWS ownership, IAM boundaries, and operational evidence clearest.

## Repository Notes

- Local web and worker AWS config is loaded from `apps/web/.env.local` or `apps/web/.env`.
- `npm run sam:env:pull` syncs local env values from the deployed SAM stack outputs.
- `npm run worker:lambda:build` builds the Lambda handler bundle.
- `npm run sam:validate` and `npm run sam:build` validate/build the SAM template.
- Generated output such as `.aws-sam/` and `dist/` should remain untracked.
