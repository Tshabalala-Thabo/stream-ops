import { Play } from "lucide-react"
import Link from "next/link"

import type { Video } from "@/lib/types"

import { formatDuration } from "./video-format"

type PublicVideoCardProps = {
  video: Video
  priority?: boolean
}

export function PublicVideoCard({ video }: PublicVideoCardProps) {
  return (
    <Link className="group block min-w-0" href={`/videos/${video.id}`}>
      <div className="relative aspect-video overflow-hidden rounded-lg bg-surface-overlay">
        {video.thumbnailUrl ? (
          <div
            aria-label={`${video.title} thumbnail`}
            className="size-full bg-cover bg-center transition duration-200 group-hover:scale-[1.03]"
            style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
          />
        ) : (
          <div className="grid size-full place-items-center bg-gradient-dark-glow">
            <Play className="size-8 text-muted-foreground" />
          </div>
        )}
        <span className="absolute bottom-2 right-2 rounded bg-foreground/86 px-1.5 py-0.5 font-mono text-xs font-medium text-background">
          {formatDuration(video.durationSeconds)}
        </span>
      </div>
      <div className="mt-3 min-w-0">
        <h2 className="line-clamp-2 font-heading text-base font-semibold leading-5 group-hover:text-primary">
          {video.title}
        </h2>
        <p className="mt-1 truncate text-sm text-muted-foreground">
          {video.owner.name}
        </p>
      </div>
    </Link>
  )
}
