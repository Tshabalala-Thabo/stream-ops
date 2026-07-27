"use client"

import { Activity, CheckCircle2, Clock3, ExternalLink, UploadCloud, XCircle } from "lucide-react"
import Link from "next/link"
import * as React from "react"

import { CreatorPageHeader } from "@/components/streamops/creator-page-header"
import { StatusChip } from "@/components/streamops/status-chip"
import { formatResolution, formatUpdatedAt } from "@/components/streamops/video-format"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Video } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  failProcessing,
  getDashboard,
  queueProcessing,
  startProcessing,
  succeedProcessing,
  type DashboardPayload,
} from "@/lib/workflow/client"

const metricCards = [
  {
    label: "Uploaded",
    icon: UploadCloud,
    getValue: ({ videos }: DashboardPayload) => videos.filter((video) => video.sourceKey).length,
  },
  {
    label: "Queued",
    icon: Clock3,
    getValue: ({ videos }: DashboardPayload) => videos.filter((video) => video.status === "queued").length,
  },
  {
    label: "Processing",
    icon: Activity,
    getValue: ({ videos }: DashboardPayload) => videos.filter((video) => video.status === "processing").length,
  },
  {
    label: "Ready",
    icon: CheckCircle2,
    getValue: ({ videos }: DashboardPayload) => videos.filter((video) => video.status === "ready").length,
  },
  {
    label: "Failed",
    icon: XCircle,
    getValue: ({ videos }: DashboardPayload) => videos.filter((video) => video.status === "failed").length,
  },
]

function nextAction(video: Video) {
  if (video.status === "uploaded") {
    return "Queue"
  }
  if (video.status === "queued") {
    return "Start"
  }
  if (video.status === "processing") {
    return "Succeed"
  }
  return null
}

export function DashboardClient() {
  const [data, setData] = React.useState<DashboardPayload>({ videos: [], uploadSessions: [] })
  const [error, setError] = React.useState<string | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [pendingVideoId, setPendingVideoId] = React.useState<string | null>(null)

  const load = React.useCallback(async () => {
    setError(null)
    try {
      setData(await getDashboard())
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load dashboard.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    void load()
  }, [load])

  async function runVideoAction(video: Video, action: "next" | "fail") {
    setPendingVideoId(video.id)
    setError(null)

    try {
      if (action === "fail") {
        await failProcessing(video.id)
      } else if (video.status === "uploaded") {
        await queueProcessing(video.id)
      } else if (video.status === "queued") {
        await startProcessing(video.id)
      } else if (video.status === "processing") {
        await succeedProcessing(video.id)
      }
      await load()
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Workflow action failed.")
    } finally {
      setPendingVideoId(null)
    }
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] bg-background text-foreground">
      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
        <CreatorPageHeader
          className="mb-6"
          description="Track the local upload and processing lifecycle before S3, DynamoDB, and SQS are introduced."
          eyebrow="Phase 1 local skeleton"
          title="Workflow dashboard"
          actions={
            <Link href="/upload" className={buttonVariants({ className: "gap-2" })}>
              <UploadCloud />
              Upload
            </Link>
          }
        />

        <div className="grid gap-3 md:grid-cols-5">
          {metricCards.map((metric) => {
            const Icon = metric.icon
            return (
              <div key={metric.label} className="rounded-lg border bg-surface p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-muted-foreground">{metric.label}</p>
                  <Icon className="size-4 text-primary" />
                </div>
                <p className="mt-3 font-heading text-2xl font-semibold">{metric.getValue(data)}</p>
              </div>
            )
          })}
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-destructive-border bg-destructive-light p-3 text-sm text-destructive-dark">
            {error}
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-lg border bg-surface">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Video</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Resolution</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Loading local workflow state
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && data.videos.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    No videos yet. Create a mocked upload to start Phase 1.
                  </TableCell>
                </TableRow>
              )}
              {data.videos.map((video) => {
                const action = nextAction(video)
                const isPending = pendingVideoId === video.id

                return (
                  <TableRow key={video.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{video.title}</p>
                        <p className="mt-1 max-w-[360px] truncate font-mono text-xs text-muted-foreground">
                          {video.sourceKey ?? video.id}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={video.status} />
                    </TableCell>
                    <TableCell>{formatResolution(video)}</TableCell>
                    <TableCell>{formatUpdatedAt(video.updatedAt)}</TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {action && (
                          <Button
                            disabled={isPending}
                            onClick={() => void runVideoAction(video, "next")}
                            size="sm"
                          >
                            {isPending ? "Working" : action}
                          </Button>
                        )}
                        {(video.status === "queued" || video.status === "processing") && (
                          <Button
                            disabled={isPending}
                            onClick={() => void runVideoAction(video, "fail")}
                            size="sm"
                            variant="outline"
                          >
                            Fail
                          </Button>
                        )}
                        <Link
                          href={`/dashboard/videos/${video.id}`}
                          className={cn(buttonVariants({ size: "icon-sm", variant: "ghost" }))}
                          aria-label={`Open ${video.title}`}
                        >
                          <ExternalLink />
                        </Link>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </section>
    </main>
  )
}
