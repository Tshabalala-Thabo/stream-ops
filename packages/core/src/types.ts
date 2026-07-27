export type EntityId = string

export type VideoStatus =
  | "uploading"
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed"
  | "cancelled"

export type UploadSessionStatus =
  | "active"
  | "completed"
  | "aborted"
  | "failed"
  | "expired"

export type ProcessingRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export type ProcessingStage =
  | "queued"
  | "probe"
  | "thumbnail"
  | "renditions"
  | "hls"
  | "ready"
  | "failed"

export type UploadedPart = {
  partNumber: number
  etag: string
  size: number
}

export type Video = {
  id: EntityId
  ownerId: EntityId
  title: string
  description: string | null
  status: VideoStatus
  sourceKey: string | null
  thumbnailKey: string | null
  playbackManifestKey: string | null
  durationSeconds: number | null
  width: number | null
  height: number | null
  processingError: string | null
  createdAt: string
  updatedAt: string
}

export type UploadSession = {
  id: EntityId
  videoId: EntityId
  ownerId: EntityId
  status: UploadSessionStatus
  objectKey: string
  multipartUploadId: string
  partSize: number
  totalParts: number
  uploadedParts: UploadedPart[]
  originalFileName: string
  originalFileSize: number
  originalMimeType: string
  expiresAt: string
  createdAt: string
  updatedAt: string
}

export type ProcessingRun = {
  id: EntityId
  videoId: EntityId
  status: ProcessingRunStatus
  stage: ProcessingStage
  metadata: Record<string, unknown> | null
  error: string | null
  startedAt: string | null
  finishedAt: string | null
  createdAt: string
  updatedAt: string
}

export type VideoRendition = {
  videoId: EntityId
  label: string
  width: number
  height: number
  bitrate: number
  playlistKey: string
  segmentPrefix: string
  createdAt: string
  updatedAt: string
}

export type CreateUploadInput = {
  ownerId: EntityId
  title: string
  description?: string | null
  fileName: string
  fileSize: number
  mimeType: string
  now?: Date
}

export type WorkflowSnapshot = {
  videos: Video[]
  uploadSessions: UploadSession[]
  processingRuns: ProcessingRun[]
  renditions: VideoRendition[]
}
