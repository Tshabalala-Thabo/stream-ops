import type { Video } from "@/lib/types"

export function formatDuration(durationSeconds: number | null) {
  if (!durationSeconds) {
    return "n/a"
  }

  const minutes = Math.floor(durationSeconds / 60)
  const seconds = durationSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

export function formatResolution(video: Pick<Video, "width" | "height">) {
  if (!video.width || !video.height) {
    return "Resolution pending"
  }

  return `${video.width}x${video.height}`
}

export function formatUpdatedAt(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value))
}

export function formatBytes(bytes: number) {
  if (bytes === 0) {
    return "0 B"
  }

  const units = ["B", "KB", "MB", "GB"]
  const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** exponent

  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${units[exponent]}`
}
