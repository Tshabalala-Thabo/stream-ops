"use client"

import { AlertCircle, Clock3, Film, Gauge, RotateCcw, UploadCloud } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import * as React from "react"

import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { DeleteVideoDialog } from "@/components/streamops/delete-video-dialog"
import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { RenditionList } from "@/components/streamops/rendition-list"
import { StatusChip } from "@/components/streamops/status-chip"
import { StreamOpsPlayer } from "@/components/streamops/streamops-player"
import {
  formatBytes,
  formatDuration,
  formatResolution,
  formatUpdatedAt,
} from "@/components/streamops/video-format"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  deleteMyVideo,
  getMyVideo,
  getMyVideoProcessingRuns,
  getMyVideoRenditions,
  getMyVideoUploadSessions,
  retryMyVideoProcessing,
} from "@/lib/api/videos"
import type {
  UploadSession,
  Video,
  VideoProcessingRun,
  VideoRendition,
} from "@/lib/types"

type VideoDetailData = {
  video: Video
  uploadSessions: UploadSession[]
  processingRuns: VideoProcessingRun[]
  renditions: VideoRendition[]
}

function isActiveUploadSession(session: UploadSession) {
  if (session.status !== "active") {
    return false
  }

  if (!session.expiresAt) {
    return true
  }

  return new Date(session.expiresAt).getTime() > Date.now()
}

function getActiveUploadSessionForVideo(
  video: Video,
  uploadSessions: UploadSession[]
) {
  if (video.status !== "uploading") {
    return null
  }

  return (
    uploadSessions.find(
      (session) =>
        String(session.videoId) === String(video.id) && isActiveUploadSession(session)
    ) ?? null
  )
}

export default function DashboardVideoDetailPage() {
  const params = useParams<{ videoId: string }>()
  const router = useRouter()
  const videoId = params.videoId
  const [data, setData] = React.useState<VideoDetailData | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isRetrying, setIsRetrying] = React.useState(false)
  const [isDeleting, setIsDeleting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  const loadVideoDetail = React.useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [video, uploadSessions, processingRuns, renditions] =
        await Promise.all([
          getMyVideo(videoId),
          getMyVideoUploadSessions(videoId),
          getMyVideoProcessingRuns(videoId),
          getMyVideoRenditions(videoId),
        ])

      setData({ video, uploadSessions, processingRuns, renditions })
    } catch (detailError) {
      setError(
        detailError instanceof Error
          ? detailError.message
          : "Unable to load this video."
      )
    } finally {
      setIsLoading(false)
    }
  }, [videoId])

  React.useEffect(() => {
    let isMounted = true

    async function loadMountedVideoDetail() {
      try {
        const [video, uploadSessions, processingRuns, renditions] =
          await Promise.all([
            getMyVideo(videoId),
            getMyVideoUploadSessions(videoId),
            getMyVideoProcessingRuns(videoId),
            getMyVideoRenditions(videoId),
          ])

        if (isMounted) {
          setData({ video, uploadSessions, processingRuns, renditions })
          setError(null)
        }
      } catch (detailError) {
        if (isMounted) {
          setError(
            detailError instanceof Error
              ? detailError.message
              : "Unable to load this video."
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    setIsLoading(true)
    void loadMountedVideoDetail()

    return () => {
      isMounted = false
    }
  }, [videoId])

  async function handleRetryProcessing() {
    if (!data) {
      return
    }

    setIsRetrying(true)
    setError(null)

    try {
      const video = await retryMyVideoProcessing(data.video.id)
      setData((current) =>
        current
          ? {
              ...current,
              video,
              renditions: [],
              processingRuns: current.processingRuns.map((run) =>
                run.status === "running" || run.status === "queued"
                  ? {
                      ...run,
                      status: "failed",
                      finishedAt: new Date().toISOString(),
                      error:
                        "Processing was retried by the creator after the queued job failed or stalled.",
                    }
                  : run
              ),
            }
          : current
      )
      await loadVideoDetail()
    } catch (retryError) {
      setError(
        retryError instanceof Error
          ? retryError.message
          : "Unable to retry processing."
      )
    } finally {
      setIsRetrying(false)
    }
  }

  async function handleDeleteVideo() {
    if (!data) {
      return
    }

    setIsDeleting(true)
    setError(null)

    try {
      await deleteMyVideo(data.video.id)
      router.replace("/dashboard#videos")
      router.refresh()
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this video."
      )
      setIsDeleting(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <Skeleton className="h-10 w-80" />
          <Skeleton className="mt-4 h-20 w-full" />
          <Skeleton className="mt-6 h-40 w-full" />
        </section>
      </main>
    )
  }

  if (error || !data) {
    return (
      <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
        <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
          <div className="rounded-lg border border-destructive-border bg-destructive-light p-4 text-destructive-dark">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-medium">
                {error ?? "This video could not be found."}
              </p>
            </div>
          </div>
        </section>
      </main>
    )
  }

  const { video, uploadSessions, processingRuns, renditions } = data
  const isReady = video.status === "ready"
  const canPlayReadyVideo = isReady && Boolean(video.playbackManifestUrl)
  const shouldShowPipeline = !isReady || !canPlayReadyVideo
  const activeUploadSession = getActiveUploadSessionForVideo(video, uploadSessions)
  const canRetryProcessing =
    shouldShowPipeline &&
    video.status === "failed" &&
    Boolean(video.sourceDisk && video.sourcePath)

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CreatorPageHeader
          actions={
            <div className="rounded-lg border bg-surface p-4">
              <p className="font-heading text-sm font-semibold">Quick actions</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {activeUploadSession && (
                  <Link
                    className={buttonVariants({
                      className: "gap-2 bg-gradient-primary text-white",
                    })}
                    href={`/upload?resumeSessionId=${activeUploadSession.id}`}
                  >
                    <UploadCloud />
                    Continue upload
                  </Link>
                )}
                {shouldShowPipeline && (
                  <button
                    className={buttonVariants({
                      className: "gap-2",
                      variant: "outline",
                    })}
                    disabled={!canRetryProcessing || isRetrying}
                    onClick={handleRetryProcessing}
                    type="button"
                  >
                    <RotateCcw />
                    {isRetrying ? "Retrying" : "Retry processing"}
                  </button>
                )}
                <DeleteVideoDialog
                  isDeleting={isDeleting}
                  onConfirm={() => void handleDeleteVideo()}
                  videoTitle={video.title}
                />
              </div>
            </div>
          }
          backHref="/dashboard#videos"
          backLabel="Back to dashboard"
          description={video.description ?? "No description provided."}
          eyebrow="Creator video detail"
          title={video.title}
        />

        <div className="mt-3">
          <StatusChip status={video.status} />
        </div>

        {video.processingError && shouldShowPipeline && (
          <section className="mt-6 rounded-lg border border-destructive-border bg-destructive-light p-4 text-destructive-dark">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <div>
                <h2 className="font-heading font-semibold">Processing error</h2>
                <p className="mt-2 text-sm leading-6">{video.processingError}</p>
              </div>
            </div>
          </section>
        )}

        {canPlayReadyVideo ? (
          <>
            <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
              <div className="min-w-0">
                <StreamOpsPlayer renditions={renditions} video={video} />
              </div>

              <aside className="rounded-lg border bg-surface p-4">
                <h2 className="font-heading text-sm font-semibold">Video details</h2>
                <div className="mt-4 grid gap-3">
                  <div className="flex items-start gap-3 rounded-md bg-surface-overlay p-3">
                    <Clock3 className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Uploaded</p>
                      <p className="text-sm font-medium">
                        {formatUpdatedAt(video.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md bg-surface-overlay p-3">
                    <Film className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="text-sm font-medium">
                        {formatDuration(video.durationSeconds)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-md bg-surface-overlay p-3">
                    <Gauge className="mt-0.5 size-4 text-primary" />
                    <div>
                      <p className="text-xs text-muted-foreground">Playback</p>
                      <p className="text-sm font-medium">
                        {formatResolution(video)} - {renditions.length}{" "}
                        {renditions.length === 1 ? "rendition" : "renditions"}
                      </p>
                    </div>
                  </div>
                </div>
              </aside>
            </section>

          </>
        ) : (
          <>
            {isReady && (
              <section className="mt-6 rounded-lg border border-info-border bg-info-light p-4 text-info-dark">
                <div className="flex gap-3">
                  <AlertCircle className="mt-0.5 size-5 shrink-0" />
                  <div>
                    <h2 className="font-heading font-semibold">
                      Playback is not available yet
                    </h2>
                    <p className="mt-2 text-sm leading-6">
                      This video is marked ready, but the playback manifest is still
                      being prepared. The pipeline status below will stay visible until
                      playback can start.
                    </p>
                  </div>
                </div>
              </section>
            )}

            <div className="mt-6">
              <PipelineTimeline status={video.status} />
            </div>

            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <section className="rounded-lg border bg-surface">
                <div className="border-b p-4">
                  <h2 className="font-heading text-sm font-semibold">
                    Upload sessions
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Provider</TableHead>
                      <TableHead>Parts</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uploadSessions.length ? (
                      uploadSessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <StatusChip status={session.status} />
                          </TableCell>
                          <TableCell className="uppercase">{session.provider}</TableCell>
                          <TableCell>
                            {session.uploadedParts.length}/{session.totalParts}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={3}>
                          No upload session is attached to this video.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </section>

              <section className="rounded-lg border bg-surface">
                <div className="border-b p-4">
                  <h2 className="font-heading text-sm font-semibold">
                    Processing runs
                  </h2>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Timing</TableHead>
                      <TableHead>Metadata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processingRuns.length ? (
                      processingRuns.map((run) => (
                        <TableRow key={run.id}>
                          <TableCell>
                            <StatusChip status={run.status} />
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {run.finishedAt
                              ? formatUpdatedAt(run.finishedAt)
                              : "running"}
                          </TableCell>
                          <TableCell className="font-mono text-xs text-muted-foreground">
                            {run.metadata?.bitrate
                              ? `${formatBytes(run.metadata.bitrate)}/s`
                              : run.error ?? "pending"}
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell className="text-muted-foreground" colSpan={3}>
                          No processing runs yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </section>
            </div>
          </>
        )}

        {isReady && (
          <div className="mt-6">
            <RenditionList renditions={renditions} />
          </div>
        )}
      </section>
    </main>
  )
}
