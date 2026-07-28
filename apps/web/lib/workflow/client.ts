import type { ProcessingRun, UploadSession, UploadedPart, Video, VideoRendition } from "@/lib/types"

export type DashboardPayload = {
  videos: Video[]
  uploadSessions: UploadSession[]
}

export type VideoDetailPayload = {
  video: Video
  uploadSessions: UploadSession[]
  processingRuns: ProcessingRun[]
  renditions: VideoRendition[]
}

export type PresignedUploadPart = {
  partNumber: number
  url: string
}

export type CreateUploadPayload = {
  video: Video
  uploadSession: UploadSession
  presignedParts?: PresignedUploadPart[]
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  })

  const payload = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(payload?.message ?? "The local workflow request failed.")
  }

  return payload as T
}

export function getDashboard() {
  return requestJson<DashboardPayload>("/api/workflow/videos")
}

export function getVideoDetail(videoId: string) {
  return requestJson<VideoDetailPayload>(`/api/workflow/videos/${videoId}`)
}

export function createUpload(payload: {
  title: string
  description: string
  fileName: string
  fileSize: number
  mimeType: string
}) {
  return requestJson<CreateUploadPayload>("/api/workflow/uploads", {
    method: "POST",
    body: JSON.stringify(payload),
  })
}

export function completeUpload(sessionId: string, parts?: UploadedPart[]) {
  return requestJson<{ video: Video; session: UploadSession }>(
    `/api/workflow/uploads/${sessionId}/complete`,
    {
      method: "POST",
      body: JSON.stringify(parts ? { parts } : {}),
    }
  )
}

export function expireUpload(sessionId: string) {
  return requestJson<{ video: Video; session: UploadSession }>(
    `/api/workflow/uploads/${sessionId}/expire`,
    { method: "POST" }
  )
}

export function queueProcessing(videoId: string) {
  return requestJson<{ video: Video; run: ProcessingRun }>(`/api/workflow/videos/${videoId}/queue`, {
    method: "POST",
  })
}

export function startProcessing(videoId: string) {
  return requestJson<{ video: Video; run: ProcessingRun }>(
    `/api/workflow/videos/${videoId}/processing/start`,
    { method: "POST" }
  )
}

export function succeedProcessing(videoId: string) {
  return requestJson<{ video: Video; run: ProcessingRun; renditions: VideoRendition[] }>(
    `/api/workflow/videos/${videoId}/processing/succeed`,
    { method: "POST" }
  )
}

export function failProcessing(videoId: string) {
  return requestJson<{ video: Video; run: ProcessingRun }>(
    `/api/workflow/videos/${videoId}/processing/fail`,
    {
      method: "POST",
      body: JSON.stringify({ error: "Local FFmpeg probe simulation failed." }),
    }
  )
}
