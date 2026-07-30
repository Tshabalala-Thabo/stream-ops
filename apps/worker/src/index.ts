import {
  DynamoDBWorkflowStore,
  S3MultipartUploadAdapter,
  SqsProcessingQueue,
  getStreamOpsAwsConfig,
  requireProcessingQueueUrl,
} from "@streamops/aws"

import { loadLocalEnv } from "./env"
import { parseProcessingJob, processProcessingJob } from "./processor"

const POLL_WAIT_SECONDS = 10

loadLocalEnv()

const config = getStreamOpsAwsConfig()
const queueUrl = requireProcessingQueueUrl(config)
const queue = new SqsProcessingQueue(queueUrl, { region: config.region })
const dynamo = new DynamoDBWorkflowStore(config.tableName, { region: config.region })
const s3 = new S3MultipartUploadAdapter(config.sourceBucket, { region: config.region })

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

    await processProcessingJob(job, { dynamo, s3 })
    await queue.deleteMessage(message.receiptHandle)
    processedCount += 1
  }

  return processedCount
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
