import assert from "node:assert/strict"
import test from "node:test"

import { safeErrorForLog, sanitizeLogFields } from "./index"

test("sanitizeLogFields redacts sensitive keys recursively", () => {
  const sanitized = sanitizeLogFields({
    ownerId: "creator-1",
    authorization: "Bearer token-value",
    nested: {
      cookie: "streamops_access_token=secret",
      videoId: "video-1",
    },
  })

  assert.deepEqual(sanitized, {
    ownerId: "creator-1",
    authorization: "[REDACTED]",
    nested: {
      cookie: "[REDACTED]",
      videoId: "video-1",
    },
  })
})

test("sanitizeLogFields redacts presigned URL values", () => {
  const sanitized = sanitizeLogFields({
    url: "https://bucket.s3.af-south-1.amazonaws.com/source/file.mp4?X-Amz-Signature=abc",
  })

  assert.deepEqual(sanitized, {
    url: "[REDACTED]",
  })
})

test("safeErrorForLog keeps error name and sanitizes message", () => {
  const sanitized = safeErrorForLog(
    new Error("request failed with access_token=secret-value")
  )

  assert.deepEqual(sanitized, {
    name: "Error",
    message: "[REDACTED]",
  })
})
