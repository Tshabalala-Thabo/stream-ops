import {
  DeleteMessageCommand,
  ReceiveMessageCommand,
  SendMessageCommand,
  SQSClient,
} from "@aws-sdk/client-sqs"

import type { EntityId } from "@streamops/core"

export type ProcessingJobMessage = {
  messageType: "PROCESS_VIDEO"
  videoId: EntityId
  ownerId: EntityId
  processingRunId: EntityId
  sourceKey: string
  requestedAt: string
}

export type ReceivedProcessingMessage = {
  id: string
  receiptHandle: string
  body: unknown
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

  async receiveMessages(options?: { maxMessages?: number; waitTimeSeconds?: number }) {
    const response = await this.client.send(
      new ReceiveMessageCommand({
        QueueUrl: this.queueUrl,
        MaxNumberOfMessages: options?.maxMessages ?? 1,
        WaitTimeSeconds: options?.waitTimeSeconds ?? 10,
        MessageAttributeNames: ["All"],
      })
    )

    return (response.Messages ?? []).flatMap<ReceivedProcessingMessage>((message) => {
      if (!message.MessageId || !message.ReceiptHandle) {
        return []
      }

      return {
        id: message.MessageId,
        receiptHandle: message.ReceiptHandle,
        body: parseMessageBody(message.Body),
      }
    })
  }

  async deleteMessage(receiptHandle: string) {
    return this.client.send(
      new DeleteMessageCommand({
        QueueUrl: this.queueUrl,
        ReceiptHandle: receiptHandle,
      })
    )
  }
}

function parseMessageBody(body: string | undefined) {
  if (!body) {
    return null
  }

  try {
    return JSON.parse(body) as unknown
  } catch {
    return null
  }
}
