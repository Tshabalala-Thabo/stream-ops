import { assertWorkflow } from "./errors"
import {
  DEFAULT_PART_SIZE,
  validateCanCompleteUpload,
  validateCreateUploadInput,
} from "./validation"
import type {
  CreateUploadInput,
  ProcessingRun,
  UploadedPart,
  UploadSession,
  Video,
  VideoRendition,
} from "./types"

const LOCAL_UPLOAD_TTL_HOURS = 24

export type IdFactory = () => string

function iso(date: Date) {
  return date.toISOString()
}

function nextTimestamp(now = new Date()) {
  return iso(now)
}

export function createLocalUpload(input: CreateUploadInput, createId: IdFactory) {
  validateCreateUploadInput(input)

  const now = input.now ?? new Date()
  const timestamp = iso(now)
  const videoId = createId()
  const uploadSessionId = createId()
  const sanitizedName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "-")
  const objectKey = `local/${input.ownerId}/${videoId}/${sanitizedName}`
  const totalParts = Math.max(1, Math.ceil(input.fileSize / DEFAULT_PART_SIZE))
  const expiresAt = new Date(now.getTime() + LOCAL_UPLOAD_TTL_HOURS * 60 * 60 * 1000)

  const video: Video = {
    id: videoId,
    ownerId: input.ownerId,
    title: input.title.trim(),
    description: input.description?.trim() || null,
    status: "uploading",
    sourceKey: null,
    thumbnailKey: null,
    playbackManifestKey: null,
    durationSeconds: null,
    width: null,
    height: null,
    processingError: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  const uploadSession: UploadSession = {
    id: uploadSessionId,
    videoId,
    ownerId: input.ownerId,
    status: "active",
    objectKey,
    multipartUploadId: `local-upload-${uploadSessionId}`,
    partSize: DEFAULT_PART_SIZE,
    totalParts,
    uploadedParts: [],
    originalFileName: input.fileName,
    originalFileSize: input.fileSize,
    originalMimeType: input.mimeType,
    expiresAt: iso(expiresAt),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return { video, uploadSession }
}

export function completeUpload(session: UploadSession, video: Video, parts?: UploadedPart[], now = new Date()) {
  validateCanCompleteUpload(session, video, now)

  const uploadedParts =
    parts ??
    Array.from({ length: session.totalParts }, (_, index) => ({
      partNumber: index + 1,
      etag: `local-etag-${session.id}-${index + 1}`,
      size:
        index + 1 === session.totalParts
          ? session.originalFileSize - session.partSize * index
          : session.partSize,
    }))

  return {
    session: {
      ...session,
      status: "completed" as const,
      uploadedParts,
      updatedAt: nextTimestamp(now),
    },
    video: {
      ...video,
      status: "uploaded" as const,
      sourceKey: session.objectKey,
      updatedAt: nextTimestamp(now),
    },
  }
}

export function expireUpload(session: UploadSession, video: Video, now = new Date()) {
  assertWorkflow(session.status === "active", "Only active upload sessions can expire.", "upload_not_active")

  return {
    session: { ...session, status: "expired" as const, updatedAt: nextTimestamp(now) },
    video: { ...video, status: "failed" as const, processingError: "Upload session expired.", updatedAt: nextTimestamp(now) },
  }
}

export function queueProcessing(video: Video, createId: IdFactory, now = new Date()) {
  assertWorkflow(video.status === "uploaded", "Only uploaded videos can be queued.", "video_not_uploaded")
  assertWorkflow(Boolean(video.sourceKey), "A source object key is required before queueing.", "source_key_required")

  const timestamp = nextTimestamp(now)
  const run: ProcessingRun = {
    id: createId(),
    videoId: video.id,
    status: "queued",
    stage: "queued",
    metadata: null,
    error: null,
    startedAt: null,
    finishedAt: null,
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  return {
    video: { ...video, status: "queued" as const, processingError: null, updatedAt: timestamp },
    run,
  }
}

export function startProcessing(video: Video, run: ProcessingRun, now = new Date()) {
  assertWorkflow(video.status === "queued", "Only queued videos can start processing.", "video_not_queued")
  assertWorkflow(run.status === "queued", "Only queued processing runs can start.", "run_not_queued")

  const timestamp = nextTimestamp(now)
  return {
    video: { ...video, status: "processing" as const, updatedAt: timestamp },
    run: { ...run, status: "running" as const, stage: "probe" as const, startedAt: timestamp, updatedAt: timestamp },
  }
}

export function completeProcessing(video: Video, run: ProcessingRun, now = new Date()) {
  assertWorkflow(video.status === "processing", "Only processing videos can complete.", "video_not_processing")
  assertWorkflow(run.status === "running", "Only running processing runs can complete.", "run_not_running")

  const timestamp = nextTimestamp(now)
  const thumbnailKey = `local/${video.ownerId}/${video.id}/thumbnail.jpg`
  const playbackManifestKey = `local/${video.ownerId}/${video.id}/hls/master.m3u8`
  const renditions: VideoRendition[] = [
    {
      videoId: video.id,
      label: "720p",
      width: 1280,
      height: 720,
      bitrate: 2800000,
      playlistKey: `local/${video.ownerId}/${video.id}/hls/720p/index.m3u8`,
      segmentPrefix: `local/${video.ownerId}/${video.id}/hls/720p/`,
      createdAt: timestamp,
      updatedAt: timestamp,
    },
  ]

  return {
    video: {
      ...video,
      status: "ready" as const,
      thumbnailKey,
      playbackManifestKey,
      durationSeconds: video.durationSeconds ?? 184,
      width: video.width ?? 1280,
      height: video.height ?? 720,
      processingError: null,
      updatedAt: timestamp,
    },
    run: {
      ...run,
      status: "completed" as const,
      stage: "ready" as const,
      metadata: { generatedRenditions: renditions.length },
      finishedAt: timestamp,
      updatedAt: timestamp,
    },
    renditions,
  }
}

export function failProcessing(video: Video, run: ProcessingRun, error: string, now = new Date()) {
  assertWorkflow(
    video.status === "queued" || video.status === "processing",
    "Only queued or processing videos can fail.",
    "video_cannot_fail_processing"
  )
  assertWorkflow(
    run.status === "queued" || run.status === "running",
    "Only queued or running processing runs can fail.",
    "run_cannot_fail"
  )

  const timestamp = nextTimestamp(now)
  const message = error.trim() || "Processing failed in the local worker simulation."

  return {
    video: { ...video, status: "failed" as const, processingError: message, updatedAt: timestamp },
    run: {
      ...run,
      status: "failed" as const,
      stage: "failed" as const,
      error: message,
      finishedAt: timestamp,
      updatedAt: timestamp,
    },
  }
}
