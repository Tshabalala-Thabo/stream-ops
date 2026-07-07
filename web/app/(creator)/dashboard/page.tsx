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

function canRetryVideoProcessing(video: Video) {
  return video.status === "failed" && Boolean(video.sourceDisk && video.sourcePath)
}

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

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground lg:h-[calc(100vh-4rem)] lg:overflow-hidden">
      <section className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:h-full lg:min-h-0">
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
          <section className="mt-6 shrink-0 rounded-lg border border-destructive-border bg-destructive-light p-4 text-destructive-dark">
            <div className="flex gap-3">
              <AlertCircle className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          </section>
        )}

        <section className="mt-6 shrink-0 rounded-lg bg-gradient-processing p-4 text-white shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-heading text-sm font-semibold">
                Operations summary
              </p>
              <p className="mt-1 text-sm text-white/75">
                Upload volume, processing health, and playback readiness at a glance.
              </p>
            </div>
            <span className="font-mono text-xs text-white/70">
              {isLoading ? "Loading..." : `${data.videos.length} total videos`}
            </span>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {metricCards.map((metric) => {
              const Icon = metric.icon

              return (
                <div
                  className="rounded-md border border-white/20 bg-white/12 p-4 backdrop-blur"
                  key={metric.label}
                >
                  <div className="flex items-center justify-between gap-3">
                    <Icon className="size-4 text-white/85" />
                    <span className="text-xs text-white/65">{metric.label}</span>
                  </div>
                  {isLoading ? (
                    <Skeleton className="mt-4 h-9 w-16 bg-white/20" />
                  ) : (
                    <p className="mt-4 text-3xl font-semibold">
                      {metric.getValue(data)}
                    </p>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        <section
          className="mt-6 min-h-0 overflow-hidden rounded-lg border bg-surface lg:flex-1 lg:overflow-y-auto"
          id="videos"
        >
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_rgb(var(--border))]">
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
                        {canRetryVideoProcessing(video) && (
                          <Link
                            className={buttonVariants({
                              className: "gap-2",
                              size: "sm",
                              variant: "outline",
                            })}
                            href={`/dashboard/videos/${video.id}`}
                          >
                            <RotateCcw />
                            Retry
                          </Link>
                        )}
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
