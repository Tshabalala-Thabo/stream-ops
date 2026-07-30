import {
  SqsProcessingQueue,
  getStreamOpsAwsConfig,
  requireProcessingDlqUrl,
} from "@streamops/aws"

import { loadLocalEnv } from "./env"

loadLocalEnv()

const config = getStreamOpsAwsConfig()
const queue = new SqsProcessingQueue(requireProcessingDlqUrl(config), { region: config.region })

try {
  const messages = await queue.receiveMessages({
    maxMessages: 10,
    visibilityTimeoutSeconds: 0,
    waitTimeSeconds: 2,
  })

  if (messages.length === 0) {
    console.log("DLQ is empty.")
  } else {
    console.log(`DLQ contains ${messages.length} visible message(s).`)
    for (const message of messages) {
      console.log(JSON.stringify({
        id: message.id,
        approximateReceiveCount: message.attributes.ApproximateReceiveCount,
        sentTimestamp: message.attributes.SentTimestamp,
        body: message.body,
      }, null, 2))
    }
  }
} catch (error) {
  if (isAccessDeniedError(error)) {
    console.error("Unable to inspect the DLQ because sdk-user is missing sqs:ReceiveMessage on the DLQ.")
    console.error("Add sqs:ReceiveMessage on arn:aws:sqs:af-south-1:086769945536:streamops-dev-processing-dlq.")
    process.exitCode = 1
  } else {
    throw error
  }
}

function isAccessDeniedError(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AccessDenied"
}
