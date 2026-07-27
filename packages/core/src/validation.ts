import { assertWorkflow } from "./errors"
import type { CreateUploadInput, EntityId, UploadSession, Video } from "./types"

export const DEFAULT_PART_SIZE = 8 * 1024 * 1024
const MAX_LOCAL_FILE_SIZE = 5 * 1024 * 1024 * 1024

export function validateOwnerAccess(entityOwnerId: EntityId, actorOwnerId: EntityId) {
  assertWorkflow(
    entityOwnerId === actorOwnerId,
    "You do not have access to this resource.",
    "ownership_denied"
  )
}

export function validateCreateUploadInput(input: CreateUploadInput) {
  assertWorkflow(input.ownerId.trim().length > 0, "Owner is required.", "owner_required")
  assertWorkflow(input.title.trim().length > 0, "Title is required.", "title_required")
  assertWorkflow(
    input.fileName.trim().length > 0,
    "A source file name is required.",
    "file_name_required"
  )
  assertWorkflow(input.fileSize > 0, "File size must be greater than zero.", "file_size_invalid")
  assertWorkflow(
    input.fileSize <= MAX_LOCAL_FILE_SIZE,
    "Local mock uploads are limited to 5 GB.",
    "file_size_too_large"
  )
  assertWorkflow(
    input.mimeType.startsWith("video/"),
    "Only video files are accepted.",
    "mime_type_invalid"
  )
}

export function isUploadExpired(session: UploadSession, now = new Date()) {
  return new Date(session.expiresAt).getTime() <= now.getTime()
}

export function validateCanCompleteUpload(session: UploadSession, video: Video, now = new Date()) {
  assertWorkflow(session.status === "active", "Only active upload sessions can complete.", "upload_not_active")
  assertWorkflow(video.status === "uploading", "Only uploading videos can be completed.", "video_not_uploading")
  assertWorkflow(!isUploadExpired(session, now), "Expired upload sessions cannot complete.", "upload_expired")
}
