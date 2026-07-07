"use client"

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  RotateCcw,
  UploadCloud,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { StatusChip } from "@/components/streamops/status-chip"
import {
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
import { getMyUploadSessions, getMyVideos } from "@/lib/api/videos"
import type { UploadSession, Video } from "@/lib/types"

type DashboardData = {
  videos: Video[]
  uploadSessions: UploadSession[]
}

const metricCards = [
  {
    label: "Uploaded",
    icon: UploadCloud,
    getValue: ({ videos }: DashboardData) =>
      videos.filter((video) => video.sourcePath).length,
  },
  {
    label: "Processing",
    icon: Activity,
    getValue: ({ videos }: DashboardData) =>
      videos.filter((video) => video.status === "processing").length,
  },
  {
    label: "Ready",
    icon: CheckCircle2,
    getValue: ({ videos }: DashboardData) =>
      videos.filter((video) => video.status === "ready").length,
  },
  {
    label: "Failed",
    icon: XCircle,
    getValue: ({ videos }: DashboardData) =>
      videos.filter((video) => video.status === "failed").length,
  },
  {
    label: "Active uploads",
    icon: Clock3,
    getValue: ({ uploadSessions }: DashboardData) =>
      uploadSessions.filter((session) => session.status === "active").length,
  },
]

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData>({
    videos: [],
    uploadSessions: [],
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadDashboard() {
      setIsLoading(true)
      setError(null)

      try {
        const [videos, uploadSessions] = await Promise.all([
          getMyVideos(),
          getMyUploadSessions(),
        ])

        if (isMounted) {
          setData({ videos, uploadSessions })
        }
      } catch (dashboardError) {
        if (isMounted) {
          setError(
            dashboardError instanceof Error
              ? dashboardError.message
              : "Unable to load dashboard data."
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadDashboard()

    return () => {
      isMounted = false
    }
  }, [])

  const activeVideo =
    data.videos.find((video) => video.status === "processing") ??
    data.videos.find((video) => video.status === "queued") ??
    data.videos.find((video) => video.status === "ready") ??
    data.videos[0]
  const latestUploadSession = data.uploadSessions[0]

  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CreatorPageHeader
          actions={
            <Link
              className={buttonVariants({
                className: "gap-2 bg-gradient-primary text-white",
              })}
              href="/upload"
            >
              <UploadCloud />
              Create upload
            </Link>
          }
          description="Track your uploaded videos from browser upload through queued processing and playback readiness."
          eyebrow="Creator dashboard"
          title="Upload and processing workspace"
        />

        {error && (
          <section className="mt-6 rounded-lg border border-destructive-border bg-destructive-light p-4 text-destructive-dark">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </section>
        )}

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {metricCards.map((metric) => {
            const Icon = metric.icon

            return (
              <div className="rounded-lg border bg-surface p-4" key={metric.label}>
                <Icon className="size-4 text-primary" />
                {isLoading ? (
                  <Skeleton className="mt-4 h-9 w-16" />
                ) : (
                  <p className="mt-4 text-3xl font-semibold">
                    {metric.getValue(data)}
                  </p>
                )}
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          {activeVideo ? (
            <PipelineTimeline
              className="bg-gradient-processing text-white [&_.text-muted-foreground]:text-white/70"
              status={activeVideo.status}
            />
          ) : (
            <section className="rounded-lg border bg-surface p-4">
              <p className="font-heading text-sm font-semibold">
                Pipeline timeline
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Upload a video to see processing progress here.
              </p>
            </section>
          )}

          <section className="rounded-lg border bg-gradient-ready p-4 text-brand-accent-foreground">
            <p className="font-heading text-sm font-semibold">Latest upload</p>
            {latestUploadSession ? (
              <>
                <div className="mt-3 flex items-center gap-2">
                  <StatusChip status={latestUploadSession.status} />
                  <span className="font-mono text-xs">
                    {latestUploadSession.uploadedParts.length}/
                    {latestUploadSession.totalParts} parts
                  </span>
                </div>
                <p className="mt-3 truncate font-mono text-xs">
                  {latestUploadSession.objectKey}
                </p>
              </>
            ) : (
              <p className="mt-3 text-sm">No upload sessions yet.</p>
            )}
          </section>
        </div>

        <section className="mt-6 rounded-lg border bg-surface" id="videos">
          <div className="flex items-center justify-between gap-4 border-b p-4">
            <div>
              <h2 className="font-heading text-sm font-semibold">Videos</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage uploaded videos, processing state, and readiness from the
                dashboard.
              </p>
            </div>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/videos"
            >
              Public catalog
            </Link>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Manifest</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading &&
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-7 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-14" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-28" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-16" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="ml-auto h-9 w-28" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data.videos.length === 0 && (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={6}>
                    No videos yet. Upload a source video to start tracking it here.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                data.videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="font-medium">{video.title}</p>
                        <p className="mt-1 max-w-md truncate font-mono text-xs text-muted-foreground">
                          {video.sourcePath ?? video.id}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          Updated {formatUpdatedAt(video.updatedAt)}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={video.status} />
                    </TableCell>
                    <TableCell>{formatDuration(video.durationSeconds)}</TableCell>
                    <TableCell>{formatResolution(video)}</TableCell>
                    <TableCell>
                      <span className="font-mono text-xs text-muted-foreground">
                        {video.playbackManifestPath ? "ready" : "pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        <button
                          className={buttonVariants({
                            className: "gap-2",
                            size: "sm",
                            variant: "outline",
                          })}
                          disabled
                          type="button"
                        >
                          <RotateCcw />
                          Retry
                        </button>
                        <Link
                          className={buttonVariants({
                            className: "gap-2",
                            size: "sm",
                          })}
                          href={`/dashboard/videos/${video.id}`}
                        >
                          <ExternalLink />
                          Open
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </section>
      </section>
    </main>
  )
}
