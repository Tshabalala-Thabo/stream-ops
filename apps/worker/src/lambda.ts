import { safeErrorForLog } from "@streamops/core"

import { parseProcessingJob, processProcessingJob } from "./processor"

type SqsRecord = {
  messageId: string
  body: string
  attributes?: Record<string, string>
}

type SqsEvent = {
  Records: SqsRecord[]
}

type SqsBatchResponse = {
  batchItemFailures: Array<{ itemIdentifier: string }>
}

export async function handler(event: SqsEvent): Promise<SqsBatchResponse> {
  const batchItemFailures: SqsBatchResponse["batchItemFailures"] = []

  for (const record of event.Records) {
    const job = parseProcessingJob(parseJson(record.body))
    if (!job) {
      console.warn(JSON.stringify({
        level: "warn",
        event: "worker.sqs.unsupported_message",
        sqsMessageId: record.messageId,
      }))
      continue
    }

    try {
      await processProcessingJob(job, undefined, {
        sqsMessageId: record.messageId,
        approximateReceiveCount: record.attributes?.ApproximateReceiveCount,
      })
    } catch (error) {
      console.error(JSON.stringify({
        level: "error",
        event: "worker.sqs.message_failed",
        sqsMessageId: record.messageId,
        error: safeErrorForLog(error),
      }))
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }

  return { batchItemFailures }
}

function parseJson(value: string) {
  try {
    return JSON.parse(value) as unknown
  } catch {
    return null
  }
}
