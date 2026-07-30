"use client"

import { Activity, CheckCircle2, Clock3, ExternalLink, FileVideo, ImageIcon, ListVideo, XCircle } from "lucide-react"
import * as React from "react"

import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { StatusChip } from "@/components/streamops/status-chip"
import { formatBytes, formatDuration, formatResolution, formatUpdatedAt } from "@/components/streamops/video-format"
import { Button, buttonVariants } from "@/components/ui/button"
import type { VideoDetailPayload } from "@/lib/workflow/client"
import { failProcessing, getVideoDetail, queueProcessing, startProcessing, succeedProcessing } from "@/lib/workflow/client"
import { cn } from "@/lib/utils"

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="border-b py-3 last:border-b-0">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <div className="mt-1 break-all text-sm">{value}</div>
    </div>
  )
}

function AssetLink({ href, label }: { href: string | null | undefined; label: string }) {
  if (!href) {
    return null
  }

  return (
    <a
      className={cn(buttonVariants({ variant: "outline", size: "xs" }), "gap-1")}
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      <ExternalLink className="size-3" />
      {label}
    </a>
  )
}

export function VideoDetailClient({ videoId }: { videoId: string }) {
  const [data, setData] = React.useState<VideoDetailPayload | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isMutating, setIsMutating] = React.useState(false)

  const load = React.useCallback(async () => {
    setError(null)
    try {
      setData(await getVideoDetail(videoId))
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load video.")
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  React.useEffect(() => {
    void load()
  }, [load])

  async function mutate(action: "queue" | "start" | "succeed" | "fail") {
    setIsMutating(true)
    setError(null)
    try {
      if (action === "queue") {
        await queueProcessing(videoId)
      } else if (action === "start") {
        await startProcessing(videoId)
      } else if (action === "succeed") {
        await succeedProcessing(videoId)
      } else {
        await failProcessing(videoId)
      }
      await load()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Workflow action failed.")
    } finally {
      setIsMutating(false)
    }
  }

  const video = data?.video
  const latestRun = data?.processingRuns[0]
  const latestSession = data?.uploadSessions[0]
  const assetAccess = data?.assetAccess

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CreatorPageHeader
          className="mb-6"
          eyebrow="Video workflow"
          title={video?.title ?? "Loading video"}
          description="Inspect the local state record, upload session, processing run, and generated asset placeholders."
          backHref="/dashboard"
          actions={
            video && (
              <>
                {video.status === "uploaded" && (
                  <Button disabled={isMutating} onClick={() => void mutate("queue")}>Queue</Button>
                )}
                {video.status === "queued" && (
                  <Button disabled={isMutating} onClick={() => void mutate("start")}>Start</Button>
                )}
                {video.status === "processing" && (
                  <Button disabled={isMutating} onClick={() => void mutate("succeed")}>Complete</Button>
                )}
                {(video.status === "queued" || video.status === "processing") && (
                  <Button disabled={isMutating} onClick={() => void mutate("fail")} variant="outline">Fail</Button>
                )}
              </>
            )
          }
        />

        {error && (
          <div className="mb-4 rounded-md border border-destructive-border bg-destructive-light p-3 text-sm text-destructive-dark">
            {error}
          </div>
        )}

        {isLoading && (
          <div className="rounded-lg border bg-surface p-6 text-sm text-muted-foreground">Loading local video state</div>
        )}

        {video && data && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <div className="space-y-6">
              <PipelineTimeline status={video.status} />

              <section className="rounded-lg border bg-surface p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-heading text-sm font-semibold">Processing run</p>
                    <p className="mt-1 text-xs text-muted-foreground">Latest local worker simulation</p>
                  </div>
                  {latestRun ? <StatusChip status={latestRun.status} /> : <StatusChip status="queued" />}
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-4">
                  {[
                    { label: "Queued", icon: Clock3, active: Boolean(latestRun) },
                    { label: "Running", icon: Activity, active: latestRun?.status === "running" || latestRun?.status === "completed" },
                    { label: "Completed", icon: CheckCircle2, active: latestRun?.status === "completed" },
                    { label: "Failed", icon: XCircle, active: latestRun?.status === "failed" },
                  ].map((item) => {
                    const Icon = item.icon
                    return (
                      <div
                        key={item.label}
                        className="rounded-md border bg-surface-overlay p-3 text-sm"
                      >
                        <Icon className={item.active ? "size-4 text-primary" : "size-4 text-muted-foreground"} />
                        <p className="mt-2 font-medium">{item.label}</p>
                      </div>
                    )
                  })}
                </div>

                {latestRun?.error && (
                  <p className="mt-4 rounded-md border border-destructive-border bg-destructive-light p-3 text-sm text-destructive-dark">
                    {latestRun.error}
                  </p>
                )}
              </section>

              <section className="rounded-lg border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ListVideo className="size-4 text-primary" />
                    <p className="font-heading text-sm font-semibold">Renditions</p>
                  </div>
                  <AssetLink href={assetAccess?.playbackManifestUrl} label="Master" />
                </div>
                <div className="mt-4 space-y-2">
                  {data.renditions.length === 0 && (
                    <p className="text-sm text-muted-foreground">Generated renditions appear after local processing completes.</p>
                  )}
                  {data.renditions.map((rendition) => {
                    const playlistUrl = assetAccess?.renditions.find((item) => item.label === rendition.label)?.playlistUrl

                    return (
                      <div key={rendition.label} className="rounded-md border bg-surface-overlay p-3 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="font-medium">{rendition.label}</p>
                            <p className="mt-1 font-mono text-xs text-muted-foreground">{rendition.width}x{rendition.height}</p>
                          </div>
                          <AssetLink href={playlistUrl} label="Playlist" />
                        </div>
                        <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{rendition.playlistKey}</p>
                      </div>
                    )
                  })}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-lg border bg-surface p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-heading text-sm font-semibold">Video record</p>
                  <StatusChip status={video.status} />
                </div>
                <div className="mt-3">
                  <DetailRow label="Video ID" value={<span className="font-mono">{video.id}</span>} />
                  <DetailRow label="Source key" value={<span className="font-mono">{video.sourceKey ?? "Pending upload"}</span>} />
                  <DetailRow label="Manifest" value={<span className="font-mono">{video.playbackManifestKey ?? "Pending processing"}</span>} />
                  <DetailRow label="Thumbnail" value={<span className="font-mono">{video.thumbnailKey ?? "Pending processing"}</span>} />
                  <DetailRow label="Duration" value={formatDuration(video.durationSeconds)} />
                  <DetailRow label="Resolution" value={formatResolution(video)} />
                  <DetailRow label="Updated" value={formatUpdatedAt(video.updatedAt)} />
                </div>
              </section>

              <section className="rounded-lg border bg-surface p-5">
                <div className="flex items-center gap-2">
                  <FileVideo className="size-4 text-info" />
                  <p className="font-heading text-sm font-semibold">Upload session</p>
                </div>
                {latestSession ? (
                  <div className="mt-3">
                    <DetailRow label="Session ID" value={<span className="font-mono">{latestSession.id}</span>} />
                    <DetailRow label="Status" value={<StatusChip status={latestSession.status} />} />
                    <DetailRow label="Parts" value={`${latestSession.uploadedParts.length}/${latestSession.totalParts}`} />
                    <DetailRow label="Size" value={formatBytes(latestSession.originalFileSize)} />
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-muted-foreground">No upload session found.</p>
                )}
              </section>

              <section className="rounded-lg border bg-surface p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="size-4 text-info" />
                    <p className="font-heading text-sm font-semibold">Preview asset</p>
                  </div>
                  <AssetLink href={assetAccess?.thumbnailUrl} label="Open" />
                </div>
                <div className="mt-4 grid aspect-video place-items-center rounded-md bg-gradient-dark-glow text-sm text-muted-foreground">
                  {video.thumbnailKey ? "Local thumbnail key generated" : "Thumbnail pending"}
                </div>
              </section>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}
