"use client"

import { AlertCircle, ExternalLink, RotateCcw } from "lucide-react"
import Link from "next/link"
import * as React from "react"

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
import { getMyVideos } from "@/lib/api/videos"
import type { Video } from "@/lib/types"

export default function DashboardVideosPage() {
  const [videos, setVideos] = React.useState<Video[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    let isMounted = true

    async function loadVideos() {
      setIsLoading(true)
      setError(null)

      try {
        const nextVideos = await getMyVideos()

        if (isMounted) {
          setVideos(nextVideos)
        }
      } catch (videosError) {
        if (isMounted) {
          setError(
            videosError instanceof Error
              ? videosError.message
              : "Unable to load videos."
          )
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    void loadVideos()

    return () => {
      isMounted = false
    }
  }, [])

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
              Creator videos
            </p>
            <h1 className="mt-3 font-heading text-3xl font-semibold">
              Management table
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Real uploaded video records with processing state, source paths,
              manifest readiness, and operational actions.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/videos">
            Public catalog
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

        <div className="mt-6 rounded-lg border bg-surface">
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
              {!isLoading && videos.length === 0 && (
                <TableRow>
                  <TableCell className="text-muted-foreground" colSpan={6}>
                    No videos yet. Upload a source video to start tracking it here.
                  </TableCell>
                </TableRow>
              )}
              {!isLoading &&
                videos.map((video) => (
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
        </div>
      </section>
    </main>
  )
}
