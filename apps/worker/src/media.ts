import { execFile } from "node:child_process"
import { mkdir, mkdtemp, readdir, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { basename, join } from "node:path"
import { promisify } from "node:util"

import { S3MultipartUploadAdapter } from "@streamops/aws"
import type { VideoRendition } from "@streamops/core"

const execFileAsync = promisify(execFile)

type RenditionPreset = {
  label: "1080p" | "720p" | "480p"
  targetShortEdge: number
  bitrate: number
  audioBitrate: string
}

const RENDITION_PRESETS: RenditionPreset[] = [
  { label: "1080p", targetShortEdge: 1080, bitrate: 5_000_000, audioBitrate: "160k" },
  { label: "720p", targetShortEdge: 720, bitrate: 2_800_000, audioBitrate: "128k" },
  { label: "480p", targetShortEdge: 480, bitrate: 1_400_000, audioBitrate: "96k" },
]

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
  assetCounts: GeneratedAssetCounts
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

export type GeneratedAssetCounts = {
  thumbnails: number
  hlsManifests: number
  hlsPlaylists: number
  hlsSegments: number
  hlsObjects: number
  totalObjects: number
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

    await input.s3.downloadObjectToFile(input.sourceKey, sourcePath)

    const metadata = await probeVideo(sourcePath)
    const renditionPlans = getRenditionPlans(metadata)

    await createThumbnail(sourcePath, thumbnailPath)
    await createHlsRenditions(sourcePath, hlsPath, renditionPlans)
    await input.s3.putObjectFromFile({
      key: thumbnailKey,
      filePath: thumbnailPath,
      contentType: "image/jpeg",
      cacheControl: "public, max-age=31536000, immutable",
    })
    const hlsObjectCounts = await uploadDirectory(input.s3, hlsPath, hlsPrefix)

    const timestamp = new Date().toISOString()

    return {
      ...metadata,
      thumbnailKey,
      playbackManifestKey,
      assetCounts: {
        thumbnails: 1,
        ...hlsObjectCounts,
        totalObjects: 1 + hlsObjectCounts.hlsObjects,
      },
      renditions: renditionPlans.map((plan) => ({
        videoId: input.videoId,
        label: plan.label,
        width: plan.width,
        height: plan.height,
        bitrate: plan.bitrate,
        playlistKey: `${hlsPrefix}/${plan.label}/index.m3u8`,
        segmentPrefix: `${hlsPrefix}/${plan.label}/`,
        createdAt: timestamp,
        updatedAt: timestamp,
      })),
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

type RenditionPlan = RenditionPreset & {
  width: number
  height: number
  scaleFilter: string
}

async function createHlsRenditions(
  sourcePath: string,
  hlsPath: string,
  renditionPlans: RenditionPlan[]
) {
  await Promise.all(
    renditionPlans.map(async (plan) => {
      const renditionPath = join(hlsPath, plan.label)
      await mkdir(renditionPath, { recursive: true })

      await execFileAsync("ffmpeg", [
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-i",
        sourcePath,
        "-vf",
        plan.scaleFilter,
        "-c:v",
        "libx264",
        "-preset",
        "veryfast",
        "-crf",
        "23",
        "-maxrate",
        String(plan.bitrate),
        "-bufsize",
        String(plan.bitrate * 2),
        "-c:a",
        "aac",
        "-b:a",
        plan.audioBitrate,
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
    })
  )

  await writeFile(
    join(hlsPath, "master.m3u8"),
    [
      "#EXTM3U",
      "#EXT-X-VERSION:3",
      ...renditionPlans.flatMap((plan) => [
        `#EXT-X-STREAM-INF:BANDWIDTH=${plan.bitrate},RESOLUTION=${plan.width}x${plan.height}`,
        `${plan.label}/index.m3u8`,
      ]),
      "",
    ].join("\n"),
    "utf8"
  )
}

async function uploadDirectory(s3: S3MultipartUploadAdapter, directoryPath: string, keyPrefix: string) {
  const entries = await readdir(directoryPath, { recursive: true, withFileTypes: true })
  const files = entries
    .filter((entry) => entry.isFile())
    .map((entry) => {
      const relativePath = entry.parentPath
        .slice(directoryPath.length)
        .replace(/^\/+/, "")
      const fileName = relativePath ? `${relativePath}/${entry.name}` : entry.name
      const filePath = join(directoryPath, fileName)

      return { fileName, filePath }
    })

  await Promise.all(
    files
      .map(({ fileName, filePath }) =>
        s3.putObjectFromFile({
          key: `${keyPrefix}/${fileName}`,
          filePath,
          contentType: getContentType(fileName),
          cacheControl: "public, max-age=31536000, immutable",
        })
      )
  )

  const hlsManifests = files.filter(({ fileName }) => fileName === "master.m3u8").length
  const hlsPlaylists = files.filter(({ fileName }) => fileName.endsWith("/index.m3u8")).length
  const hlsSegments = files.filter(({ fileName }) => fileName.endsWith(".ts")).length

  return {
    hlsManifests,
    hlsPlaylists,
    hlsSegments,
    hlsObjects: files.length,
  }
}

function getRenditionPlans(metadata: VideoProbeMetadata): RenditionPlan[] {
  const sourceQuality = getSourceQuality(metadata)

  return RENDITION_PRESETS
    .filter((preset) => preset.targetShortEdge <= sourceQuality + 8)
    .map((preset) => {
      const dimensions = calculateScaledDimensions(metadata.width, metadata.height, preset.targetShortEdge)

      return {
        ...preset,
        ...dimensions,
      }
    })
}

function getSourceQuality(metadata: VideoProbeMetadata) {
  if (metadata.width && metadata.height) {
    return Math.min(metadata.width, metadata.height)
  }

  return metadata.height ?? 720
}

function calculateScaledDimensions(width: number | null, height: number | null, targetShortEdge: number) {
  if (!width || !height) {
    return {
      width: targetShortEdge === 1080 ? 1920 : targetShortEdge === 720 ? 1280 : 854,
      height: targetShortEdge,
      scaleFilter: `scale=-2:${targetShortEdge}`,
    }
  }

  if (width <= height) {
    const targetWidth = makeEven(Math.min(width, targetShortEdge))
    const scaledHeight = makeEven(Math.round((height * targetWidth) / width))

    return {
      width: targetWidth,
      height: scaledHeight,
      scaleFilter: `scale=${targetWidth}:-2`,
    }
  }

  const targetHeight = makeEven(Math.min(height, targetShortEdge))
  const scaledWidth = makeEven(Math.round((width * targetHeight) / height))

  return {
    width: scaledWidth,
    height: targetHeight,
    scaleFilter: `scale=-2:${targetHeight}`,
  }
}

function makeEven(value: number) {
  return value % 2 === 0 ? value : value + 1
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
