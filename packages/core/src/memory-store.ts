import { WorkflowError } from "./errors"
import {
  completeProcessing,
  completeUpload,
  createLocalUpload,
  expireUpload,
  failProcessing,
  queueProcessing,
  startProcessing,
} from "./transitions"
import { validateOwnerAccess } from "./validation"
import type {
  CreateUploadInput,
  EntityId,
  ProcessingRun,
  UploadSession,
  Video,
  VideoRendition,
  WorkflowSnapshot,
} from "./types"

export class InMemoryWorkflowStore {
  private videos = new Map<EntityId, Video>()
  private uploadSessions = new Map<EntityId, UploadSession>()
  private processingRuns = new Map<EntityId, ProcessingRun>()
  private renditions = new Map<EntityId, VideoRendition[]>()
  private sequence = 0

  constructor(seed?: WorkflowSnapshot) {
    seed?.videos.forEach((video) => this.videos.set(video.id, video))
    seed?.uploadSessions.forEach((session) => this.uploadSessions.set(session.id, session))
    seed?.processingRuns.forEach((run) => this.processingRuns.set(run.id, run))
    seed?.renditions.forEach((rendition) => {
      const existing = this.renditions.get(rendition.videoId) ?? []
      this.renditions.set(rendition.videoId, [...existing, rendition])
    })
  }

  private createId() {
    this.sequence += 1
    return `local_${this.sequence.toString().padStart(6, "0")}`
  }

  snapshot(): WorkflowSnapshot {
    return {
      videos: Array.from(this.videos.values()),
      uploadSessions: Array.from(this.uploadSessions.values()),
      processingRuns: Array.from(this.processingRuns.values()),
      renditions: Array.from(this.renditions.values()).flat(),
    }
  }

  createUpload(input: CreateUploadInput) {
    const created = createLocalUpload(input, () => this.createId())
    this.videos.set(created.video.id, created.video)
    this.uploadSessions.set(created.uploadSession.id, created.uploadSession)
    return created
  }

  listVideos(ownerId: EntityId) {
    return Array.from(this.videos.values())
      .filter((video) => video.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  getVideo(videoId: EntityId, ownerId: EntityId) {
    const video = this.videos.get(videoId)
    if (!video) {
      throw new WorkflowError("Video was not found.", "video_not_found")
    }
    validateOwnerAccess(video.ownerId, ownerId)
    return video
  }

  getUploadSession(sessionId: EntityId, ownerId: EntityId) {
    const session = this.uploadSessions.get(sessionId)
    if (!session) {
      throw new WorkflowError("Upload session was not found.", "upload_not_found")
    }
    validateOwnerAccess(session.ownerId, ownerId)
    return session
  }

  listUploadSessions(ownerId: EntityId) {
    return Array.from(this.uploadSessions.values()).filter((session) => session.ownerId === ownerId)
  }

  listProcessingRuns(videoId: EntityId, ownerId: EntityId) {
    this.getVideo(videoId, ownerId)
    return Array.from(this.processingRuns.values())
      .filter((run) => run.videoId === videoId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  listRenditions(videoId: EntityId, ownerId: EntityId) {
    this.getVideo(videoId, ownerId)
    return this.renditions.get(videoId) ?? []
  }

  completeUpload(sessionId: EntityId, ownerId: EntityId, now = new Date()) {
    const session = this.getUploadSession(sessionId, ownerId)
    const video = this.getVideo(session.videoId, ownerId)
    const completed = completeUpload(session, video, undefined, now)
    this.uploadSessions.set(session.id, completed.session)
    this.videos.set(video.id, completed.video)
    return completed
  }

  expireUpload(sessionId: EntityId, ownerId: EntityId, now = new Date()) {
    const session = this.getUploadSession(sessionId, ownerId)
    const video = this.getVideo(session.videoId, ownerId)
    const expired = expireUpload(session, video, now)
    this.uploadSessions.set(session.id, expired.session)
    this.videos.set(video.id, expired.video)
    return expired
  }

  queueProcessing(videoId: EntityId, ownerId: EntityId, now = new Date()) {
    const video = this.getVideo(videoId, ownerId)
    const queued = queueProcessing(video, () => this.createId(), now)
    this.videos.set(video.id, queued.video)
    this.processingRuns.set(queued.run.id, queued.run)
    return queued
  }

  startProcessing(videoId: EntityId, ownerId: EntityId, now = new Date()) {
    const video = this.getVideo(videoId, ownerId)
    const run = this.getLatestRun(videoId)
    const started = startProcessing(video, run, now)
    this.videos.set(video.id, started.video)
    this.processingRuns.set(run.id, started.run)
    return started
  }

  completeProcessing(videoId: EntityId, ownerId: EntityId, now = new Date()) {
    const video = this.getVideo(videoId, ownerId)
    const run = this.getLatestRun(videoId)
    const completed = completeProcessing(video, run, now)
    this.videos.set(video.id, completed.video)
    this.processingRuns.set(run.id, completed.run)
    this.renditions.set(video.id, completed.renditions)
    return completed
  }

  failProcessing(videoId: EntityId, ownerId: EntityId, error: string, now = new Date()) {
    const video = this.getVideo(videoId, ownerId)
    const run = this.getLatestRun(videoId)
    const failed = failProcessing(video, run, error, now)
    this.videos.set(video.id, failed.video)
    this.processingRuns.set(run.id, failed.run)
    return failed
  }

  private getLatestRun(videoId: EntityId) {
    const run = Array.from(this.processingRuns.values())
      .filter((candidate) => candidate.videoId === videoId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0]

    if (!run) {
      throw new WorkflowError("Processing run was not found.", "processing_run_not_found")
    }

    return run
  }
}
