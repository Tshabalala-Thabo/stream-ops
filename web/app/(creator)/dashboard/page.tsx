"use client"

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  UploadCloud,
  XCircle,
} from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { StatusChip } from "@/components/streamops/status-chip"
import { formatUpdatedAt } from "@/components/streamops/video-format"
import { buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
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
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
              Creator dashboard
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold">
              Upload and processing workspace
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Track your uploaded videos from browser upload through queued
              processing and playback readiness.
            </p>
          </div>
          <Link
            className={buttonVariants({
              className: "gap-2 bg-gradient-primary text-white",
            })}
            href="/upload"
          >
            <UploadCloud />
            Create upload
          </Link>
        </div>

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

        <section className="mt-6 rounded-lg border bg-surface">
          <div className="flex items-center justify-between gap-4 border-b p-4">
            <h2 className="font-heading text-sm font-semibold">Recent videos</h2>
            <Link
              className={buttonVariants({ size: "sm", variant: "outline" })}
              href="/dashboard/videos"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {isLoading &&
              Array.from({ length: 4 }).map((_, index) => (
                <div className="grid gap-3 p-4 md:grid-cols-[1fr_auto_auto]" key={index}>
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-7 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            {!isLoading && data.videos.length === 0 && (
              <div className="p-6 text-sm text-muted-foreground">
                No videos yet. Start an upload to create your first source video.
              </div>
            )}
            {!isLoading &&
              data.videos.slice(0, 5).map((video) => (
                <Link
                  className="grid gap-3 p-4 text-sm transition-colors hover:bg-muted/50 md:grid-cols-[1fr_auto_auto]"
                  href={`/dashboard/videos/${video.id}`}
                  key={video.id}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{video.title}</p>
                    <p className="mt-1 truncate font-mono text-xs text-muted-foreground">
                      {video.sourcePath ?? video.id}
                    </p>
                  </div>
                  <StatusChip status={video.status} />
                  <span className="font-mono text-xs text-muted-foreground">
                    {formatUpdatedAt(video.updatedAt)}
                  </span>
                </Link>
              ))}
          </div>
        </section>
      </section>
    </main>
  )
}
