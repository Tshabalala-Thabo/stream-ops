import {
  DynamoDBWorkflowStore,
  S3MultipartUploadAdapter,
  getStreamOpsAwsConfig,
  type ProcessingJobMessage,
} from "@streamops/aws"

import { WorkflowError, safeErrorForLog, sanitizeLogFields } from "@streamops/core"

import { logWorkerEmfMetric } from "./emf"
import { processVideoAssets } from "./media"

export type WorkerServices = {
  dynamo: DynamoDBWorkflowStore
  s3: S3MultipartUploadAdapter
}

export type ProcessingJobContext = {
  sqsMessageId?: string
  approximateReceiveCount?: string
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
  services: WorkerServices = createWorkerServices(),
  context: ProcessingJobContext = {}
) {
  const startedAt = Date.now()
  logWorkerInfo("worker.processing.started", {
    ...getJobLogContext(job, context),
    sourceKey: job.sourceKey,
  })
  logWorkerEmfMetric({
    outcome: "started",
    metrics: [{ name: "ProcessingStarted", unit: "Count", value: 1 }],
    fields: getJobLogContext(job, context),
  })

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
    logWorkerInfo("worker.processing.completed", {
      ...getJobLogContext(job, context),
      durationSeconds: assets.durationSeconds,
      width: assets.width,
      height: assets.height,
      renditionCount: assets.renditions.length,
      assetCounts: assets.assetCounts,
    })
    logWorkerEmfMetric({
      outcome: "succeeded",
      metrics: [
        { name: "ProcessingSucceeded", unit: "Count", value: 1 },
        { name: "ProcessingDurationMs", unit: "Milliseconds", value: Date.now() - startedAt },
        { name: "RenditionCount", unit: "Count", value: assets.renditions.length },
      ],
      fields: getJobLogContext(job, context),
    })
  } catch (error) {
    if (error instanceof WorkflowError) {
      logWorkerError("worker.processing.workflow_error", {
        ...getJobLogContext(job, context),
        errorCode: error.code,
      })
      logWorkerEmfMetric({
        outcome: "workflow_error",
        metrics: [
          { name: "ProcessingFailed", unit: "Count", value: 1 },
          { name: "WorkflowError", unit: "Count", value: 1 },
          { name: "ProcessingDurationMs", unit: "Milliseconds", value: Date.now() - startedAt },
        ],
        fields: {
          ...getJobLogContext(job, context),
          errorCode: error.code,
        },
      })
      throw error
    }

    const safeError = safeErrorForLog(error)
    const message = safeError.message
    await services.dynamo.failProcessing(job.videoId, job.ownerId, message, job.processingRunId).catch(() => undefined)
    logWorkerError("worker.processing.failed", {
      ...getJobLogContext(job, context),
      error: safeError,
    })
    logWorkerEmfMetric({
      outcome: "failed",
      metrics: [
        { name: "ProcessingFailed", unit: "Count", value: 1 },
        { name: "ProcessingDurationMs", unit: "Milliseconds", value: Date.now() - startedAt },
      ],
      fields: {
        ...getJobLogContext(job, context),
        error: safeError,
      },
    })
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

function getJobLogContext(job: ProcessingJobMessage, context: ProcessingJobContext) {
  return {
    videoId: job.videoId,
    ownerId: job.ownerId,
    processingRunId: job.processingRunId,
    sqsMessageId: context.sqsMessageId,
    approximateReceiveCount: context.approximateReceiveCount,
  }
}

function logWorkerInfo(event: string, fields: Record<string, unknown>) {
  console.log(JSON.stringify({ level: "info", event, ...sanitizeLogFields(fields) }))
}

function logWorkerError(event: string, fields: Record<string, unknown>) {
  console.error(JSON.stringify({ level: "error", event, ...sanitizeLogFields(fields) }))
}
