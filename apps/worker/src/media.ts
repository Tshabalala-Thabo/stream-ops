import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { promisify } from "node:util"

import { S3MultipartUploadAdapter } from "@streamops/aws"
import type { VideoRendition } from "@streamops/core"

const execFileAsync = promisify(execFile)

export type VideoProbeMetadata = {
  durationSeconds: number | null
  width: number | null
  height: number | null
}

export type ProcessVideoAssetsInput = {
  s3: S3MultipartUploadAdapter
  sourceKey: string
  ownerId: string
  videoId: string
}

export type ProcessedVideoAssets = VideoProbeMetadata & {
  thumbnailKey: string
  playbackManifestKey: string
  renditions: VideoRendition[]
}

type FfprobeOutput = {
  format?: {
    duration?: string
  }
  streams?: Array<{
    codec_type?: string
    width?: number
    height?: number
  }>
}

export async function processVideoAssets(input: ProcessVideoAssetsInput): Promise<ProcessedVideoAssets> {
  const workspace = await mkdtemp(join(tmpdir(), "streamops-worker-"))

  try {
    const sourcePath = join(workspace, sanitizePathSegment(basename(input.sourceKey)) || "source-video")
    const thumbnailPath = join(workspace, "thumbnail.jpg")
    const hlsPath = join(workspace, "hls")
    const thumbnailKey = `generated/${input.ownerId}/${input.videoId}/thumbnail.jpg`
    const hlsPrefix = `generated/${input.ownerId}/${input.videoId}/hls`
    const playbackManifestKey = `${hlsPrefix}/master.m3u8`
    const renditionPlaylistKey = `${hlsPrefix}/720p/index.m3u8`
    const segmentPrefix = `${hlsPrefix}/720p/`

    await input.s3.downloadObjectToFile(input.sourceKey, sourcePath)

    const metadata = await probeVideo(sourcePath)
    await createThumbnail(sourcePath, thumbnailPath)
    await createHlsRendition(sourcePath, hlsPath, metadata)
    await input.s3.putObjectFromFile({
      key: thumbnailKey,
      filePath: thumbnailPath,
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
    })
    await uploadDirectory(input.s3, hlsPath, hlsPrefix)

    const timestamp = new Date().toISOString()

    return {
      ...metadata,
      thumbnailKey,
      playbackManifestKey,
      renditions: [
        {
          videoId: input.videoId,
          label: "720p",
          width: Math.min(metadata.width ?? 1280, 1280),
          height: calculateScaledHeight(metadata.width, metadata.height),
          bitrate: 2_800_000,
          playlistKey: renditionPlaylistKey,
          segmentPrefix,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
    }
  } finally {
    await rm(workspace, { force: true, recursive: true })
  }
}

async function probeVideo(sourcePath: string): Promise<VideoProbeMetadata> {
  const { stdout } = await execFileAsync("ffprobe", [
    "-v",
    "error",
    "-print_format",
    "json",
    "-show_format",
    "-show_streams",
    sourcePath,
  ])
  const output = JSON.parse(stdout) as FfprobeOutput
  const videoStream = output.streams?.find((stream) => stream.codec_type === "video")
  const duration = Number(output.format?.duration)

  return {
    durationSeconds: Number.isFinite(duration) ? Math.round(duration) : null,
    width: videoStream?.width ?? null,
    height: videoStream?.height ?? null,
  }
}

async function createThumbnail(sourcePath: string, thumbnailPath: string) {
  await execFileAsync("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-ss",
    "00:00:01",
    "-i",
    sourcePath,
    "-frames:v",
    "1",
    "-vf",
    "scale='min(1280,iw)':-2",
    thumbnailPath,
  ])
}

async function createHlsRendition(
  sourcePath: string,
  hlsPath: string,
  metadata: VideoProbeMetadata
) {
  const renditionPath = join(hlsPath, "720p")
  await mkdir(renditionPath, { recursive: true })

  await execFileAsync("ffmpeg", [
    "-y",
    "-hide_banner",
    "-loglevel",
    "error",
    "-i",
    sourcePath,
    "-vf",
    "scale='min(1280,iw)':-2",
    "-c:v",
    "libx264",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-f",
    "hls",
    "-hls_time",
    "6",
    "-hls_playlist_type",
    "vod",
    "-hls_segment_filename",
    join(renditionPath, "segment-%03d.ts"),
    join(renditionPath, "index.m3u8"),
  ])

  await writeFile(
    join(hlsPath, "master.m3u8"),
    [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      `#EXT-X-STREAM-INF:BANDWIDTH=2800000,RESOLUTION=${Math.min(metadata.width ?? 1280, 1280)}x${calculateScaledHeight(metadata.width, metadata.height)}`,
      "720p/index.m3u8",
      "",
    ].join("\n"),
    "utf8"
  )
}

async function uploadDirectory(s3: S3MultipartUploadAdapter, directoryPath: string, keyPrefix: string) {
  const entries = await readdir(directoryPath, { recursive: true, withFileTypes: true })

  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map((entry) => {
        const relativePath = entry.parentPath
          .slice(directoryPath.length)
          .replace(/^\/+/, "")
        const fileName = relativePath ? `${relativePath}/${entry.name}` : entry.name
        const filePath = join(directoryPath, fileName)

        return s3.putObjectFromFile({
          key: `${keyPrefix}/${fileName}`,
          filePath,
          contentType: getContentType(fileName),
          cacheControl: "public, max-age=31536000, immutable",
        })
      })
  )
}

function calculateScaledHeight(width: number | null, height: number | null) {
  if (!width || !height) {
    return 720
  }

  if (width <= 1280) {
    return height
  }

  const scaledHeight = Math.round((height * 1280) / width)
  return scaledHeight % 2 === 0 ? scaledHeight : scaledHeight + 1
}

function getContentType(fileName: string) {
  if (fileName.endsWith(".m3u8")) {
    return "application/vnd.apple.mpegurl"
  }

  if (fileName.endsWith(".ts")) {
    return "video/mp2t"
  }

  return "application/octet-stream"
}

function sanitizePathSegment(value: string) {
  return value.replace(/[^a-zA-Z0-9._-]/g, "-")
}
