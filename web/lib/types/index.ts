export type ApiValidationErrors = Record<string, string[]>

export type ApiErrorResponse = {
  message?: string
  errors?: ApiValidationErrors
}

export type User = {
  id: number
  name: string
  email: string
  emailVerifiedAt: string | null
  createdAt: string
  updatedAt: string
}

export type LoginPayload = {
  email: string
  password: string
  remember?: boolean
}

export type RegisterPayload = {
  name: string
  email: string
  password: string
  passwordConfirmation: string
}

export type VideoStatus =
  | "draft"
  | "uploading"
  | "uploaded"
  | "queued"
  | "processing"
  | "ready"
  | "failed"

export type UploadSessionStatus =
  | "pending"
  | "active"
  | "completed"
  | "aborted"
  | "failed"

export type ProcessingRunStatus =
  | "queued"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"

export type VideoOwner = Pick<User, "id" | "name" | "email">

export type UploadedPart = {
  partNumber: number
  etag: string
  size: number
}

export type VideoProcessingMetadata = {
  durationSeconds?: number
  width?: number
  height?: number
  codec?: string
  bitrate?: number
  frameRate?: number
}

export type Video = {
  id: number | string
  userId: number
  title: string
  description: string | null
  status: VideoStatus
  durationSeconds: number | null
  width: number | null
  height: number | null
  sourceDisk: string | null
  sourcePath: string | null
  playbackManifestPath: string | null
  playbackManifestUrl: string | null
  thumbnailPath: string | null
  thumbnailUrl: string | null
  previewSpritePath: string | null
  previewSpriteUrl: string | null
  previewTrackPath: string | null
  previewTrackUrl: string | null
  previewIntervalSeconds: number | null
  processingError: string | null
  owner: VideoOwner
  createdAt: string
  updatedAt: string
}

export type UploadSession = {
  id: number | string
  videoId: number | string
  provider: "s3" | "r2" | "minio" | string
  multipartUploadId: string | null
  objectKey: string
  status: UploadSessionStatus
  partSize: number
  totalParts: number
  uploadedParts: UploadedPart[]
  expiresAt: string | null
  createdAt: string
  updatedAt: string
  video?: Video
}

export type VideoProcessingRun = {
  id: number | string
  videoId: number | string
  status: ProcessingRunStatus
  startedAt: string | null
  finishedAt: string | null
  error: string | null
  metadata: VideoProcessingMetadata | null
  createdAt: string
  updatedAt: string
}

export type VideoRendition = {
  id: number | string
  videoId: number | string
  label: "480p" | "720p" | "1080p" | string
  width: number
  height: number
  bitrate: number | null
  codec: string | null
  playlistPath: string
  playlistUrl: string
  segmentPrefix: string
  createdAt: string
  updatedAt: string
}
