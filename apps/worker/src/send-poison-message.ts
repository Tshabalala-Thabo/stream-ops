import {
  SqsProcessingQueue,
  getStreamOpsAwsConfig,
  requireProcessingQueueUrl,
} from "@streamops/aws"

import { loadLocalEnv } from "./env"

loadLocalEnv()

const config = getStreamOpsAwsConfig()
const queue = new SqsProcessingQueue(requireProcessingQueueUrl(config), { region: config.region })
const timestamp = new Date().toISOString()
const suffix = Date.now().toString()

const message = {
  messageType: "PROCESS_VIDEO" as const,
  videoId: `poison-video-${suffix}`,
  ownerId: "local-creator-1",
  processingRunId: `poison-run-${suffix}`,
  sourceKey: `source/local-creator-1/poison-video-${suffix}/missing.mp4`,
  requestedAt: timestamp,
}

await queue.sendProcessingJob(message)

console.log("Poison processing message sent.")
console.log(JSON.stringify(message, null, 2))
