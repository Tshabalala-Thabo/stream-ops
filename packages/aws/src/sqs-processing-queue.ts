import { SendMessageCommand, SQSClient } from "@aws-sdk/client-sqs"

import type { EntityId } from "@streamops/core"

export type ProcessingJobMessage = {
  messageType: "PROCESS_VIDEO"
  videoId: EntityId
  ownerId: EntityId
  processingRunId: EntityId
  sourceKey: string
  requestedAt: string
}

export class SqsProcessingQueue {
  private readonly client: SQSClient

  constructor(
    private readonly queueUrl: string,
    options?: { client?: SQSClient; region?: string }
  ) {
    this.client = options?.client ?? new SQSClient({ region: options?.region })
  }

  async sendProcessingJob(message: ProcessingJobMessage) {
    return this.client.send(
      new SendMessageCommand({
        QueueUrl: this.queueUrl,
        MessageBody: JSON.stringify(message),
        MessageAttributes: {
          messageType: {
            DataType: "String",
            StringValue: message.messageType,
          },
          videoId: {
            DataType: "String",
            StringValue: message.videoId,
          },
          processingRunId: {
            DataType: "String",
            StringValue: message.processingRunId,
          },
        },
      })
    )
  }
}
