import { apiFetch } from "@/lib/api/client"
import type {
  UploadSession,
  Video,
  VideoProcessingRun,
  VideoRendition,
} from "@/lib/types"

type ApiResource<T> = {
  data: T
}

export async function getMyVideos(): Promise<Video[]> {
  const response = await apiFetch<ApiResource<Video[]>>("/api/me/videos")

  return response.data
}

export async function getMyVideo(videoId: Video["id"]): Promise<Video> {
  const response = await apiFetch<ApiResource<Video>>(`/api/me/videos/${videoId}`)

  return response.data
}

export async function getMyVideoUploadSessions(
  videoId: Video["id"]
): Promise<UploadSession[]> {
  const response = await apiFetch<ApiResource<UploadSession[]>>(
    `/api/me/videos/${videoId}/upload-sessions`
  )

  return response.data
}

export async function getMyUploadSessions(): Promise<UploadSession[]> {
  const response = await apiFetch<ApiResource<UploadSession[]>>(
    "/api/me/upload-sessions"
  )

  return response.data
}

export async function getMyVideoProcessingRuns(
  videoId: Video["id"]
): Promise<VideoProcessingRun[]> {
  const response = await apiFetch<ApiResource<VideoProcessingRun[]>>(
    `/api/videos/${videoId}/processing-runs`
  )

  return response.data
}

export async function getMyVideoRenditions(
  videoId: Video["id"]
): Promise<VideoRendition[]> {
  const response = await apiFetch<ApiResource<VideoRendition[]>>(
    `/api/me/videos/${videoId}/renditions`
  )

  return response.data
}

export async function retryMyVideoProcessing(videoId: Video["id"]): Promise<Video> {
  const response = await apiFetch<ApiResource<Video>>(
    `/api/me/videos/${videoId}/retry-processing`,
    {
      method: "POST",
    }
  )

  return response.data
}
