import {
  DynamoDBWorkflowStore,
  S3MultipartUploadAdapter,
  getStreamOpsAwsConfig,
} from "@streamops/aws"

const globalForAwsWorkflow = globalThis as typeof globalThis & {
  streamOpsAwsWorkflow?: {
    dynamo: DynamoDBWorkflowStore
    s3Uploads: S3MultipartUploadAdapter
  }
}

export function getAwsWorkflow() {
  if (!globalForAwsWorkflow.streamOpsAwsWorkflow) {
    const config = getStreamOpsAwsConfig()

    globalForAwsWorkflow.streamOpsAwsWorkflow = {
      dynamo: new DynamoDBWorkflowStore(config.tableName, { region: config.region }),
      s3Uploads: new S3MultipartUploadAdapter(config.sourceBucket, { region: config.region }),
    }
  }

  return globalForAwsWorkflow.streamOpsAwsWorkflow
}
