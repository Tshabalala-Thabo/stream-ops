import {
  DynamoDBWorkflowStore,
  S3MultipartUploadAdapter,
  getStreamOpsAwsConfig,
  type ProcessingJobMessage,
} from "@streamops/aws"

import { WorkflowError } from "@streamops/core"

import { processVideoAssets } from "./media"

export type WorkerServices = {
  dynamo: DynamoDBWorkflowStore
  s3: S3MultipartUploadAdapter
}

export function createWorkerServices(): WorkerServices {
  const config = getStreamOpsAwsConfig()

  return {
    dynamo: new DynamoDBWorkflowStore(config.tableName, { region: config.region }),
    s3: new S3MultipartUploadAdapter(config.sourceBucket, { region: config.region }),
  }
}

export async function processProcessingJob(
  job: ProcessingJobMessage,
  services: WorkerServices = createWorkerServices()
) {
  console.log(`Processing video ${job.videoId} with run ${job.processingRunId}.`)

  try {
    await services.dynamo.startProcessing(job.videoId, job.ownerId, job.processingRunId)

    const assets = await processVideoAssets({
      s3: services.s3,
      sourceKey: job.sourceKey,
      ownerId: job.ownerId,
      videoId: job.videoId,
    })

    await services.dynamo.completeProcessing(job.videoId, job.ownerId, job.processingRunId, new Date(), {
      durationSeconds: assets.durationSeconds,
      width: assets.width,
      height: assets.height,
      thumbnailKey: assets.thumbnailKey,
      playbackManifestKey: assets.playbackManifestKey,
      renditions: assets.renditions,
    })
    console.log(`Video ${job.videoId} marked ready.`)
  } catch (error) {
    if (error instanceof WorkflowError) {
      console.error(`Workflow error for ${job.videoId}: ${error.code}`)
      throw error
    }

    const message = error instanceof Error ? error.message : "Unknown worker error."
    await services.dynamo.failProcessing(job.videoId, job.ownerId, message, job.processingRunId).catch(() => undefined)
    throw error
  }
}

export function parseProcessingJob(value: unknown): ProcessingJobMessage | null {
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
