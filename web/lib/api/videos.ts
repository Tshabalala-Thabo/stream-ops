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

export async function getPublicVideos(query?: string): Promise<Video[]> {
  const search = query?.trim()
  const path = search
    ? `/api/videos?q=${encodeURIComponent(search)}`
    : "/api/videos"
  const response = await apiFetch<ApiResource<Video[]>>(path, {
    cache: "no-store",
  })

  return response.data
}

export async function getPublicVideo(videoId: Video["id"]): Promise<Video> {
  const response = await apiFetch<ApiResource<Video>>(`/api/videos/${videoId}`, {
    cache: "no-store",
  })

  return response.data
}

export async function getPublicVideoRenditions(
  videoId: Video["id"]
): Promise<VideoRendition[]> {
  const response = await apiFetch<ApiResource<VideoRendition[]>>(
    `/api/videos/${videoId}/renditions`,
    {
      cache: "no-store",
    }
  )

  return response.data
}

export async function getRelatedPublicVideos(
  videoId: Video["id"]
): Promise<Video[]> {
  const videos = await getPublicVideos()

  return videos.filter((video) => video.id !== videoId)
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
