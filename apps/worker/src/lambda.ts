import { parseProcessingJob, processProcessingJob } from "./processor"

type SqsRecord = {
  messageId: string
  body: string
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
      console.warn(`Ignoring unsupported SQS message ${record.messageId}.`)
      continue
    }

    try {
      await processProcessingJob(job)
    } catch (error) {
      console.error(`Failed to process SQS message ${record.messageId}.`, error)
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
