"use client"

import {
  Activity,
  AlertCircle,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MoreHorizontal,
  MonitorPlay,
  RotateCcw,
  Trash2,
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteMyVideo, getMyUploadSessions, getMyVideos } from "@/lib/api/videos"
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

function VideoThumbnail({ video }: { video: Video }) {
  return (
    <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded-md bg-surface-overlay">
      {video.thumbnailUrl ? (
        <div
          aria-label={`${video.title} thumbnail`}
          className="size-full bg-cover bg-center"
          role="img"
          style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
        />
      ) : (
        <div
          aria-label={`${video.title} thumbnail placeholder`}
          className="grid size-full place-items-center bg-gradient-dark-glow"
          role="img"
        >
          <MonitorPlay className="size-6 text-muted-foreground" />
        </div>
      )}
    </div>
  )
}

type VideoActionsMenuProps = {
  isDeleting: boolean
  onDelete: () => void
  video: Video
}

function VideoActionsMenu({ isDeleting, onDelete, video }: VideoActionsMenuProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false)

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              aria-label={`Actions for ${video.title}`}
              size="icon-sm"
              type="button"
              variant="ghost"
            />
          }
        >
          <MoreHorizontal />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-44">
          <DropdownMenuItem render={<Link href={`/dashboard/videos/${video.id}`} />}>
            <ExternalLink />
            Open
          </DropdownMenuItem>
          {canRetryVideoProcessing(video) && (
            <DropdownMenuItem render={<Link href={`/dashboard/videos/${video.id}`} />}>
              <RotateCcw />
              Retry processing
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setIsDeleteDialogOpen(true)}
            variant="destructive"
          >
            <Trash2 />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this video?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove {video.title} and all uploaded, preview,
              and playback files attached to it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              onClick={onDelete}
              variant="destructive"
            >
              {isDeleting ? "Deleting" : "Delete video"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

export default function DashboardPage() {
  const [data, setData] = React.useState<DashboardData>({
    videos: [],
    uploadSessions: [],
  })
  const [isLoading, setIsLoading] = React.useState(true)
  const [deletingVideoId, setDeletingVideoId] = React.useState<Video["id"] | null>(
    null
  )
  const [error, setError] = React.useState<string | null>(null)
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null)

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

  async function handleDeleteVideo(video: Video) {
    setDeletingVideoId(video.id)
    setError(null)
    setSuccessMessage(null)

    try {
      await deleteMyVideo(video.id)
      setData((current) => ({
        videos: current.videos.filter((item) => item.id !== video.id),
        uploadSessions: current.uploadSessions.filter(
          (session) => session.videoId !== video.id
        ),
      }))
      setSuccessMessage(`${video.title} was deleted.`)
    } catch (deleteError) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Unable to delete this video."
      )
    } finally {
      setDeletingVideoId(null)
    }
  }

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
               Upload
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

        {successMessage && (
          <section className="mt-6 shrink-0 rounded-lg border border-success-border bg-success-light p-4 text-success-dark">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
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
          <Table containerClassName="lg:overflow-visible">
            <TableHeader className="sticky top-0 z-10 bg-surface shadow-[0_1px_0_rgb(var(--border))]">
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Resolution</TableHead>
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
                      <Skeleton className="ml-auto size-8" />
                    </TableCell>
                  </TableRow>
                ))}
              {!isLoading && data.videos.length === 0 && (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={5}>
                    No videos yet. Upload a source video to start tracking it here.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                data.videos.map((video) => (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div className="flex min-w-[22rem] items-center gap-3">
                        <VideoThumbnail video={video} />
                        <div className="min-w-0">
                          <p className="font-medium">{video.title}</p>
                          {video.description && (
                            <p className="mt-1 max-w-md truncate text-xs text-muted-foreground">
                              {video.description}
                            </p>
                          )}
                          <p className="mt-1 text-xs text-muted-foreground">
                            Updated {formatUpdatedAt(video.updatedAt)}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={video.status} />
                    </TableCell>
                    <TableCell>{formatDuration(video.durationSeconds)}</TableCell>
                    <TableCell>{formatResolution(video)}</TableCell>
                    <TableCell className="text-right">
                      <VideoActionsMenu
                        isDeleting={deletingVideoId === video.id}
                        onDelete={() => void handleDeleteVideo(video)}
                        video={video}
                      />
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
