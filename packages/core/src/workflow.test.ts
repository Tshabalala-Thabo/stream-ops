import assert from "node:assert/strict"
import test from "node:test"

import { InMemoryWorkflowStore, WorkflowError } from "./index"

const ownerId = "local-creator-1"

function createUpload(store = new InMemoryWorkflowStore()) {
  return store.createUpload({
    ownerId,
    title: "Launch recap",
    description: "Phase 1 local upload",
    fileName: "launch-recap.mp4",
    fileSize: 18_000_000,
    mimeType: "video/mp4",
    now: new Date("2026-07-27T10:00:00.000Z"),
  })
}

test("creator upload creates an uploading video and active upload session", () => {
  const { video, uploadSession } = createUpload()

  assert.equal(video.status, "uploading")
  assert.equal(uploadSession.status, "active")
  assert.equal(uploadSession.videoId, video.id)
})

test("upload completion moves session and video to completed/uploaded", () => {
  const store = new InMemoryWorkflowStore()
  const { uploadSession } = createUpload(store)

  const completed = store.completeUpload(uploadSession.id, ownerId)

  assert.equal(completed.session.status, "completed")
  assert.equal(completed.video.status, "uploaded")
  assert.equal(completed.video.sourceKey, uploadSession.objectKey)
})

test("processing can queue, start, and complete with generated assets", () => {
  const store = new InMemoryWorkflowStore()
  const { uploadSession } = createUpload(store)
  const { video } = store.completeUpload(uploadSession.id, ownerId)

  const queued = store.queueProcessing(video.id, ownerId)
  const started = store.startProcessing(video.id, ownerId)
  const completed = store.completeProcessing(video.id, ownerId)

  assert.equal(queued.video.status, "queued")
  assert.equal(started.video.status, "processing")
  assert.equal(completed.video.status, "ready")
  assert.equal(completed.run.status, "completed")
  assert.equal(completed.renditions.length, 1)
})

test("processing failure stores useful error details", () => {
  const store = new InMemoryWorkflowStore()
  const { uploadSession } = createUpload(store)
  const { video } = store.completeUpload(uploadSession.id, ownerId)
  store.queueProcessing(video.id, ownerId)

  const failed = store.failProcessing(video.id, ownerId, "FFmpeg probe failed")

  assert.equal(failed.video.status, "failed")
  assert.equal(failed.run.status, "failed")
  assert.equal(failed.run.error, "FFmpeg probe failed")
})

test("ownership denial prevents cross-creator reads", () => {
  const store = new InMemoryWorkflowStore()
  const { video } = createUpload(store)

  assert.throws(
    () => store.getVideo(video.id, "local-creator-2"),
    (error) => error instanceof WorkflowError && error.code === "ownership_denied"
  )
})

test("expired uploads cannot complete", () => {
  const store = new InMemoryWorkflowStore()
  const { uploadSession } = createUpload(store)
  const expired = store.expireUpload(uploadSession.id, ownerId)

  assert.equal(expired.session.status, "expired")
  assert.throws(
    () => store.completeUpload(uploadSession.id, ownerId),
    (error) => error instanceof WorkflowError && error.code === "upload_not_active"
  )
})
