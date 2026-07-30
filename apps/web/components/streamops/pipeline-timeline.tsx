import { CheckCircle2, Circle, Loader2, XCircle } from "lucide-react"

import type { ProcessingRun, UploadSession, Video, VideoRendition } from "@/lib/types"
import { cn } from "@/lib/utils"

type TimelineItemState = "complete" | "active" | "pending" | "failed"

type TimelineItem = {
  id: string
  label: string
  detail: string
  state: TimelineItemState
}

type PipelineTimelineProps = {
  video: Video
  uploadSessions: UploadSession[]
  processingRuns: ProcessingRun[]
  renditions: VideoRendition[]
  className?: string
}

export function PipelineTimeline({
  video,
  uploadSessions,
  processingRuns,
  renditions,
  className,
}: PipelineTimelineProps) {
  const latestSession = uploadSessions[0]
  const latestRun = processingRuns[0]
  const items = buildTimelineItems(video, latestSession, latestRun, renditions)
  const activeItem = items.find((item) => item.state === "active")
  const failedItem = items.find((item) => item.state === "failed")

  return (
    <div className={cn("rounded-lg border bg-surface p-4", className)}>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-heading text-sm font-semibold">Pipeline timeline</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Built from upload sessions, processing runs, and generated asset records
          </p>
        </div>
        {activeItem && (
          <span className="rounded-md bg-gradient-processing px-2 py-1 text-xs font-medium text-white">
            {activeItem.label}
          </span>
        )}
        {failedItem && (
          <span className="rounded-md bg-destructive-light px-2 py-1 text-xs font-medium text-destructive-dark ring-1 ring-destructive-border">
            {failedItem.label}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        {items.map((item) => {
          return (
            <div
              className={cn(
                "min-h-24 rounded-md border p-3 text-xs",
                item.state === "complete" && "border-success-border bg-success-light text-success-dark",
                item.state === "active" && "border-info-border bg-info-light text-info-dark",
                item.state === "failed" && "border-destructive-border bg-destructive-light text-destructive-dark"
              )}
              key={item.id}
            >
              <div className="flex items-start gap-2">
                {item.state === "failed" ? (
                  <XCircle className="size-4" />
                ) : item.state === "active" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : item.state === "complete" ? (
                  <CheckCircle2 className="size-4" />
                ) : (
                  <Circle className="size-4 text-muted-foreground" />
                )}
                <span className="font-medium">{item.label}</span>
              </div>
              <p className="mt-2 leading-5 text-muted-foreground">{item.detail}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildTimelineItems(
  video: Video,
  latestSession: UploadSession | undefined,
  latestRun: ProcessingRun | undefined,
  renditions: VideoRendition[]
): TimelineItem[] {
  const uploadComplete = Boolean(video.sourceKey) || latestSession?.status === "completed"
  const processingQueued = Boolean(latestRun)
  const processingRunning = latestRun?.status === "running"
  const processingComplete = latestRun?.status === "completed" || video.status === "ready"
  const processingFailed = video.status === "failed" || latestRun?.status === "failed"
  const thumbnailComplete = Boolean(video.thumbnailKey)
  const renditionsComplete = renditions.length > 0
  const manifestComplete = Boolean(video.playbackManifestKey)

  return [
    {
      id: "upload",
      label: "Upload",
      detail: uploadComplete
        ? `${latestSession?.uploadedParts.length ?? 0}/${latestSession?.totalParts ?? 0} parts stored`
        : latestSession?.status === "active"
          ? `${latestSession.uploadedParts.length}/${latestSession.totalParts} parts uploaded`
          : "Waiting for a completed source object",
      state: stateFrom({ complete: uploadComplete, active: video.status === "uploading", failed: latestSession?.status === "failed" || latestSession?.status === "expired" }),
    },
    {
      id: "queue",
      label: "Queue",
      detail: latestRun ? `Run ${latestRun.id}` : "Waiting for a processing run",
      state: stateFrom({ complete: processingQueued && video.status !== "queued", active: video.status === "queued", failed: processingFailed && !latestRun }),
    },
    {
      id: "worker",
      label: "Worker",
      detail: latestRun
        ? `Run status: ${latestRun.status}, stage: ${latestRun.stage}`
        : "Worker has not started",
      state: stateFrom({ complete: processingComplete, active: processingRunning || latestRun?.status === "queued", failed: processingFailed }),
    },
    {
      id: "thumbnail",
      label: "Thumbnail",
      detail: thumbnailComplete ? video.thumbnailKey ?? "" : "No thumbnail key recorded",
      state: stateFrom({ complete: thumbnailComplete, active: latestRun?.stage === "thumbnail", failed: processingFailed && !thumbnailComplete }),
    },
    {
      id: "renditions",
      label: "Renditions",
      detail: renditionsComplete
        ? `${renditions.map((rendition) => rendition.label).join(", ")} recorded`
        : "No rendition records found",
      state: stateFrom({ complete: renditionsComplete, active: latestRun?.stage === "renditions", failed: processingFailed && !renditionsComplete }),
    },
    {
      id: "manifest",
      label: "HLS manifest",
      detail: manifestComplete ? video.playbackManifestKey ?? "" : "No master manifest key recorded",
      state: stateFrom({ complete: manifestComplete, active: latestRun?.stage === "hls", failed: processingFailed && !manifestComplete }),
    },
  ]
}

function stateFrom({
  complete,
  active,
  failed,
}: {
  complete: boolean
  active: boolean
  failed: boolean
}): TimelineItemState {
  if (failed) {
    return "failed"
  }

  if (complete) {
    return "complete"
  }

  if (active) {
    return "active"
  }

  return "pending"
}
