import {
  DynamoDBWorkflowStore,
  S3MultipartUploadAdapter,
  SqsProcessingQueue,
  getStreamOpsAwsConfig,
  requireProcessingQueueUrl,
} from "@streamops/aws"

const globalForAwsWorkflow = globalThis as typeof globalThis & {
  streamOpsAwsWorkflow?: {
    config: ReturnType<typeof getStreamOpsAwsConfig>
    dynamo: DynamoDBWorkflowStore
    s3Uploads: S3MultipartUploadAdapter
    getProcessingQueue: () => SqsProcessingQueue
  }
}

export function getAwsWorkflow() {
  if (!globalForAwsWorkflow.streamOpsAwsWorkflow) {
    const config = getStreamOpsAwsConfig()

    globalForAwsWorkflow.streamOpsAwsWorkflow = {
      config,
      dynamo: new DynamoDBWorkflowStore(config.tableName, { region: config.region }),
      s3Uploads: new S3MultipartUploadAdapter(config.sourceBucket, { region: config.region }),
      getProcessingQueue: () =>
        new SqsProcessingQueue(requireProcessingQueueUrl(config), { region: config.region }),
    }
  }

  return globalForAwsWorkflow.streamOpsAwsWorkflow
}
