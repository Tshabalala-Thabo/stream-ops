# AWS Services

## Amazon S3

Used for:

- Original source videos
- Thumbnails
- HLS master manifests
- HLS rendition playlists
- HLS segments

Practicals:

- Multipart upload
- Presigned URLs
- Object lifecycle rules
- Server-side encryption
- Bucket policies
- Cache headers for public playback assets

## Amazon DynamoDB

Used for:

- Videos
- Upload sessions
- Processing runs
- Renditions

Practicals:

- Partition and sort keys
- Conditional writes
- TTL
- Query vs scan
- Eventually consistent vs strongly consistent reads
- Serialization and deserialization

## Amazon SQS

Used for:

- Processing job queue
- Dead-letter queue

Practicals:

- Visibility timeout
- Receive count
- Batch size
- Idempotent consumers
- DLQ redrive

## AWS Lambda

Used for:

- Lightweight handlers
- Upload session creation
- Multipart completion
- Queue/event handlers where practical

Practicals:

- Environment variables
- Timeout, memory, concurrency
- Error handling
- Destinations or DLQ concepts
- Test events
- Aliases and deployment strategies

## Amazon Cognito

Used for:

- User sign-up and sign-in
- JWT issuer
- Creator identity

Practicals:

- User pools
- JWT validation
- Bearer tokens
- App client configuration

## IAM and STS

Used for:

- Least-privilege access
- Runtime roles
- Cross-service calls

Practicals:

- Identity policies
- Resource policies
- Role assumptions
- Removing wildcard permissions

## KMS, Secrets Manager, Parameter Store, AppConfig

Used for:

- Encryption
- Secrets
- Runtime configuration

Practicals:

- Key rotation
- AWS managed vs customer-managed keys
- Secure secret retrieval
- Environment-specific configuration

## CloudWatch and X-Ray

Used for:

- Logs
- Metrics
- Traces
- Dashboards
- Alarms

Practicals:

- Logs Insights queries
- EMF custom metrics
- Trace annotations
- Health and readiness checks

