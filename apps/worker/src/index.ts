import {
  DynamoDBWorkflowStore,
  SqsProcessingQueue,
  getStreamOpsAwsConfig,
  requireProcessingQueueUrl,
  type ProcessingJobMessage,
} from "@streamops/aws"

import { WorkflowError } from "@streamops/core"

import { loadLocalEnv } from "./env"

const POLL_WAIT_SECONDS = 10

loadLocalEnv()

const config = getStreamOpsAwsConfig()
const queueUrl = requireProcessingQueueUrl(config)
const dynamo = new DynamoDBWorkflowStore(config.tableName, { region: config.region })
const queue = new SqsProcessingQueue(queueUrl, { region: config.region })

async function main() {
  const once = process.argv.includes("--once")

  do {
    const processedCount = await pollOnce()
    if (once) {
      console.log(`Worker pass complete. Processed ${processedCount} message(s).`)
      return
    }
  } while (true)
}

async function pollOnce() {
  const messages = await queue.receiveMessages({ maxMessages: 1, waitTimeSeconds: POLL_WAIT_SECONDS })
  let processedCount = 0

  for (const message of messages) {
    const job = parseProcessingJob(message.body)
    if (!job) {
      console.warn(`Deleting unsupported SQS message ${message.id}.`)
      await queue.deleteMessage(message.receiptHandle)
      processedCount += 1
      continue
    }

    await processJob(job)
    await queue.deleteMessage(message.receiptHandle)
    processedCount += 1
  }

  return processedCount
}

async function processJob(job: ProcessingJobMessage) {
  console.log(`Processing video ${job.videoId} with run ${job.processingRunId}.`)

  try {
    await dynamo.startProcessing(job.videoId, job.ownerId, job.processingRunId)

    await new Promise((resolve) => setTimeout(resolve, 500))

    await dynamo.completeProcessing(job.videoId, job.ownerId, job.processingRunId)
    console.log(`Video ${job.videoId} marked ready.`)
  } catch (error) {
    if (error instanceof WorkflowError) {
      console.error(`Workflow error for ${job.videoId}: ${error.code}`)
      throw error
    }

    const message = error instanceof Error ? error.message : "Unknown worker error."
    await dynamo.failProcessing(job.videoId, job.ownerId, message, job.processingRunId).catch(() => undefined)
    throw error
  }
}

function parseProcessingJob(value: unknown): ProcessingJobMessage | null {
  if (!value || typeof value !== "object") {
    return null
  }

  const candidate = value as Partial<ProcessingJobMessage>
  if (
    candidate.messageType !== "PROCESS_VIDEO" ||
    !candidate.videoId ||
    !candidate.ownerId ||
    !candidate.processingRunId ||
    !candidate.sourceKey ||
    !candidate.requestedAt
  ) {
    return null
  }

  return {
    messageType: "PROCESS_VIDEO",
    videoId: String(candidate.videoId),
    ownerId: String(candidate.ownerId),
    processingRunId: String(candidate.processingRunId),
    sourceKey: String(candidate.sourceKey),
    requestedAt: String(candidate.requestedAt),
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
