import { Layers3 } from "lucide-react"

import type { VideoRendition } from "@/lib/types"

type RenditionListProps = {
  renditions: VideoRendition[]
}

export function RenditionList({ renditions }: RenditionListProps) {
  if (renditions.length === 0) {
    return (
      <div className="rounded-lg border bg-surface p-4 text-sm text-muted-foreground">
        No rendition playlists have been generated yet.
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-surface">
      <div className="flex items-center gap-2 border-b p-4">
        <Layers3 className="size-4 text-primary" />
        <h2 className="font-heading text-sm font-semibold">Renditions</h2>
      </div>
      <div className="divide-y">
        {renditions.map((rendition) => (
          <div
            className="grid gap-3 p-4 text-sm md:grid-cols-[120px_1fr_auto]"
            key={rendition.id}
          >
            <div>
              <p className="font-heading font-semibold">{rendition.label}</p>
              <p className="text-xs text-muted-foreground">
                {rendition.width}x{rendition.height}
              </p>
            </div>
            <div className="min-w-0">
              <p className="truncate font-mono text-xs text-muted-foreground">
                {rendition.playlistPath}
              </p>
              <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                Prefix: {rendition.segmentPrefix}
              </p>
            </div>
            <p className="font-mono text-xs text-muted-foreground">
              {rendition.bitrate ? `${Math.round(rendition.bitrate / 1000)} kbps` : "n/a"}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
