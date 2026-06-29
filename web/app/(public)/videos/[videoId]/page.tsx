import { AlertCircle, FileVideo, MonitorPlay } from "lucide-react"
import { notFound } from "next/navigation"

import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { RenditionList } from "@/components/streamops/rendition-list"
import { StatusChip } from "@/components/streamops/status-chip"
import {
  formatDuration,
  formatResolution,
  formatUpdatedAt,
} from "@/components/streamops/video-format"
import {
  getDummyProcessingRunsForVideo,
  getDummyRenditionsForVideo,
  getDummyVideoById,
  getDummyVideos,
} from "@/lib/data/dummy-videos"

type VideoDetailPageProps = {
  params: Promise<{ videoId: string }>
}

export function generateStaticParams() {
  return getDummyVideos().map((video) => ({ videoId: video.id.toString() }))
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { videoId } = await params
  const video = getDummyVideoById(videoId)

  if (!video) {
    notFound()
  }

  const renditions = getDummyRenditionsForVideo(video.id)
  const latestRun = getDummyProcessingRunsForVideo(video.id)[0] ?? null
  const isReady = video.status === "ready"

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section>
          <div className="overflow-hidden rounded-lg border bg-surface">
            <div className="grid aspect-video place-items-center bg-foreground text-background">
              {isReady ? (
                <div className="text-center">
                  <MonitorPlay className="mx-auto size-12 text-brand-accent" />
                  <p className="mt-4 font-heading text-xl font-semibold">
                    Playback preview
                  </p>
                  <p className="mt-2 max-w-md text-sm text-background/70">
                    The real HLS player will mount here once backend streaming
                    endpoints are available.
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <FileVideo className="mx-auto size-12 text-background/55" />
                  <p className="mt-4 font-heading text-xl font-semibold">
                    Playback pending
                  </p>
                  <p className="mt-2 text-sm text-background/70">
                    Manifest is not ready for this status.
                  </p>
                </div>
              )}
            </div>
            <div className="p-5">
              <div className="flex flex-wrap items-center gap-3">
                <StatusChip status={video.status} />
                <span className="font-mono text-xs text-muted-foreground">
                  {formatResolution(video)}
                </span>
                <span className="font-mono text-xs text-muted-foreground">
                  {formatDuration(video.durationSeconds)}
                </span>
              </div>
              <h1 className="mt-4 font-heading text-3xl font-semibold">
                {video.title}
              </h1>
              <p className="mt-3 max-w-3xl leading-7 text-muted-foreground">
                {video.description}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <PipelineTimeline status={video.status} />
          </div>
          <div className="mt-6">
            <RenditionList renditions={renditions} />
          </div>
        </section>

        <aside className="space-y-4">
          <section className="rounded-lg border bg-surface p-4">
            <h2 className="font-heading text-sm font-semibold">Public metadata</h2>
            <dl className="mt-4 grid gap-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Owner</dt>
                <dd className="font-medium">{video.owner.name}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Updated</dt>
                <dd className="font-mono text-xs">{formatUpdatedAt(video.updatedAt)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Manifest readiness</dt>
                <dd className="font-mono text-xs">
                  {video.playbackManifestPath ?? "pending"}
                </dd>
              </div>
            </dl>
          </section>

          {video.processingError && (
            <section className="rounded-lg border border-destructive-border bg-destructive-light p-4 text-destructive-dark">
              <div className="flex gap-3">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <h2 className="font-heading text-sm font-semibold">
                    Processing issue
                  </h2>
                  <p className="mt-2 text-sm leading-6">{video.processingError}</p>
                </div>
              </div>
            </section>
          )}

          <section className="rounded-lg border bg-surface p-4">
            <h2 className="font-heading text-sm font-semibold">Latest run</h2>
            {latestRun ? (
              <div className="mt-3 space-y-2 text-sm">
                <StatusChip status={latestRun.status} />
                <p className="font-mono text-xs text-muted-foreground">
                  {latestRun.id}
                </p>
              </div>
            ) : (
              <p className="mt-3 text-sm text-muted-foreground">
                No processing run has started.
              </p>
            )}
          </section>
        </aside>
      </div>
    </div>
  )
}
