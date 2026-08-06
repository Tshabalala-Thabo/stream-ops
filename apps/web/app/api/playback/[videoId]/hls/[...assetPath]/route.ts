import { getAwsWorkflow } from "@/lib/workflow/aws"
import { AuthError, authenticateCognitoRequest } from "@/lib/auth/cognito"
import { logWarn } from "@/lib/logging"
import { isAwsWorkflowStore } from "@/lib/workflow/store"
import type { Video, VideoRendition } from "@/lib/types"
import { WorkflowError } from "@streamops/core"

const PLAYLIST_CONTENT_TYPE = "application/vnd.apple.mpegurl"
const SEGMENT_CONTENT_TYPE = "video/mp2t"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string; assetPath: string[] }> }
) {
  const { videoId, assetPath } = await params

  if (!isAwsWorkflowStore()) {
    return Response.json({ message: "Playback proxy is only available in AWS workflow mode." }, { status: 404 })
  }

  if (!isSafeAssetPath(assetPath)) {
    return Response.json({ message: "Invalid playback asset path." }, { status: 400 })
  }

  try {
    const creator = await authenticateCognitoRequest(request)
    const { dynamo, s3Uploads } = getAwsWorkflow()
    const [video, renditions] = await Promise.all([
      dynamo.getVideo(videoId, creator.ownerId),
      dynamo.listRenditions(videoId, creator.ownerId),
    ])

    const hlsPrefix = getHlsPrefix(video)
    const key = `${hlsPrefix}/${assetPath.join("/")}`

    if (!isAllowedPlaybackKey(key, video, renditions)) {
      return new Response("Playback asset was not found.", { status: 404 })
    }

    const object = await s3Uploads.getObjectBytes(key)
    const contentType = getPlaybackContentType(key, object.contentType)

    if (key.endsWith(".m3u8")) {
      const playlist = new TextDecoder().decode(object.body)
      const rewritten = rewritePlaylist(playlist, `/api/playback/${video.id}/hls`, assetPath)

      return new Response(rewritten, {
        headers: playbackHeaders(PLAYLIST_CONTENT_TYPE),
      })
    }

    return new Response(toArrayBuffer(object.body), {
      headers: playbackHeaders(contentType),
    })
  } catch (error) {
    if (error instanceof AuthError) {
      logWarn("playback.auth.rejected", { videoId, errorCode: error.code })
      return Response.json(
        { authenticated: false, code: error.code, message: error.message },
        { status: 401 }
      )
    }

    if (error instanceof WorkflowError) {
      logWarn("playback.request.rejected", { videoId, errorCode: error.code })
      return Response.json(
        { code: error.code, message: error.message },
        { status: error.code.endsWith("_not_found") ? 404 : 400 }
      )
    }

    if (isAccessDeniedError(error)) {
      logWarn("playback.s3.access_denied", { videoId })
      return Response.json(
        {
          code: "playback_s3_access_denied",
          message: "The playback proxy could not read this HLS object. Confirm the video has fresh generated HLS files and s3:GetObject access to generated/*.",
        },
        { status: 403 }
      )
    }

    throw error
  }
}

function getHlsPrefix(video: Video) {
  if (!video.playbackManifestKey?.endsWith("/master.m3u8")) {
    throw new Error("Video does not have a generated HLS manifest.")
  }

  return video.playbackManifestKey.slice(0, -"/master.m3u8".length)
}

function isAllowedPlaybackKey(key: string, video: Video, renditions: VideoRendition[]) {
  if (key === video.playbackManifestKey) {
    return true
  }

  return renditions.some((rendition) => {
    if (key === rendition.playlistKey) {
      return true
    }

    return key.startsWith(rendition.segmentPrefix) && key.endsWith(".ts")
  })
}

function rewritePlaylist(playlist: string, routePrefix: string, assetPath: string[]) {
  const currentDirectory = assetPath.slice(0, -1)

  return playlist
    .split("\n")
    .map((line) => {
      const trimmed = line.trim()

      if (!trimmed || trimmed.startsWith("#") || isAbsoluteUrl(trimmed)) {
        return line
      }

      const nextPath = normalizePlaylistReference([...currentDirectory, trimmed])
      return `${routePrefix}/${nextPath.map(encodeURIComponent).join("/")}`
    })
    .join("\n")
}

function normalizePlaylistReference(parts: string[]) {
  const normalized: string[] = []

  for (const part of parts.join("/").split("/")) {
    if (!part || part === ".") {
      continue
    }

    if (part === "..") {
      normalized.pop()
      continue
    }

    normalized.push(part)
  }

  return normalized
}

function isSafeAssetPath(assetPath: string[]) {
  return assetPath.length > 0 && assetPath.every((part) => part && part !== "." && part !== ".." && !part.includes("/"))
}

function isAbsoluteUrl(value: string) {
  return value.startsWith("http://") || value.startsWith("https://") || value.startsWith("//")
}

function getPlaybackContentType(key: string, fallback: string) {
  if (key.endsWith(".m3u8")) {
    return PLAYLIST_CONTENT_TYPE
  }

  if (key.endsWith(".ts")) {
    return SEGMENT_CONTENT_TYPE
  }

  return fallback
}

function playbackHeaders(contentType: string) {
  return {
    "cache-control": "private, max-age=30",
    "content-type": contentType,
  }
}

function toArrayBuffer(bytes: Uint8Array) {
  const buffer = new ArrayBuffer(bytes.byteLength)
  new Uint8Array(buffer).set(bytes)
  return buffer
}

function isAccessDeniedError(error: unknown) {
  return typeof error === "object" && error !== null && "name" in error && error.name === "AccessDenied"
}
