import { Clock3, MonitorPlay } from "lucide-react"
import Link from "next/link"

import { StatusChip } from "@/components/streamops/status-chip"
import type { Video } from "@/lib/types"

import { formatDuration, formatResolution, formatUpdatedAt } from "./video-format"

type VideoCardProps = {
  video: Video
  href: string
}

export function VideoCard({ video, href }: VideoCardProps) {
  return (
    <Link
      className="group block overflow-hidden rounded-lg border bg-surface shadow-sm transition-colors hover:border-primary/35"
      href={href}
    >
      <div className="relative aspect-video bg-surface-overlay">
        {video.thumbnailUrl ? (
          <div
            aria-label={`${video.title} thumbnail`}
            className="size-full bg-cover bg-center"
            style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-dark-glow">
            <MonitorPlay className="size-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute left-3 top-3">
          <StatusChip status={video.status} />
        </div>
      </div>
      <div className="p-4">
        <h2 className="font-heading text-base font-semibold group-hover:text-primary">
          {video.title}
        </h2>
        <p className="mt-2 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground">
          {video.description}
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span>{video.owner.name}</span>
          <span className="flex items-center gap-1">
            <Clock3 className="size-3.5" />
            {formatDuration(video.durationSeconds)}
          </span>
          <span>{formatResolution(video)}</span>
        </div>
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Updated {formatUpdatedAt(video.updatedAt)}
        </p>
      </div>
    </Link>
  )
}
