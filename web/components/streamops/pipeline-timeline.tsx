import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"

import type { VideoStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const stages = [
  "uploaded",
  "queued",
  "processing",
  "thumbnail",
  "renditions",
  "hls",
  "ready",
] as const

const stageLabels: Record<(typeof stages)[number], string> = {
  uploaded: "Uploaded",
  queued: "Queued",
  processing: "Processing",
  thumbnail: "Thumbnail",
  renditions: "Renditions",
  hls: "HLS",
  ready: "Ready",
}

const statusStage: Record<VideoStatus, number> = {
  draft: -1,
  uploading: -1,
  uploaded: 0,
  queued: 1,
  processing: 2,
  ready: stages.length - 1,
  failed: -1,
}

type PipelineTimelineProps = {
  status: VideoStatus
  className?: string
}

export function PipelineTimeline({ status, className }: PipelineTimelineProps) {
  const activeIndex = statusStage[status]

  return (
    <div className={cn("rounded-lg border bg-surface p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-semibold">Pipeline timeline</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload to playback readiness
          </p>
        </div>
        {status === "processing" && (
          <span className="rounded-md bg-gradient-processing px-2 py-1 text-xs font-medium text-white">
            Active worker
          </span>
        )}
        {status === "ready" && (
          <span className="rounded-md bg-gradient-ready px-2 py-1 text-xs font-medium text-brand-accent-foreground">
            Playback ready
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-7">
        {stages.map((stage, index) => {
          const isComplete = status === "ready" || index < activeIndex
          const isActive = index === activeIndex && status !== "ready"
          const isFailed = status === "failed" && index === 2

          return (
            <div
              className={cn(
                "rounded-md border p-3 text-xs",
                isComplete && "border-success-border bg-success-light text-success-dark",
                isActive && "border-info-border bg-info-light text-info-dark",
                isFailed && "border-destructive-border bg-destructive-light text-destructive-dark"
              )}
              key={stage}
            >
              <div className="flex items-center gap-2">
                {isFailed ? (
                  <XCircle className="size-4" />
                ) : isActive ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : isComplete ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium">{stageLabels[stage]}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
