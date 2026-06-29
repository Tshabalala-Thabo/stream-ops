import { AlertCircle, RotateCcw } from "lucide-react"
import { notFound } from "next/navigation"

import { CopyButton } from "@/components/streamops/copy-button"
import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { RenditionList } from "@/components/streamops/rendition-list"
import { StatusChip } from "@/components/streamops/status-chip"
import { formatBytes, formatUpdatedAt } from "@/components/streamops/video-format"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getDummyProcessingRunsForVideo,
  getDummyRenditionsForVideo,
  getDummyUploadSessionsForVideo,
  getDummyVideoById,
} from "@/lib/data/dummy-videos"

type DashboardVideoDetailPageProps = {
  params: Promise<{ videoId: string }>
}

export default async function DashboardVideoDetailPage({
  params,
}: DashboardVideoDetailPageProps) {
  const { videoId } = await params
  const video = getDummyVideoById(videoId)

  if (!video) {
    notFound()
  }

  const uploadSessions = getDummyUploadSessionsForVideo(video.id)
  const processingRuns = getDummyProcessingRunsForVideo(video.id)
  const renditions = getDummyRenditionsForVideo(video.id)

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6">
      <section className="mx-auto max-w-7xl">
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <div>
            <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
              Creator video detail
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <h1 className="font-heading text-3xl font-semibold">{video.title}</h1>
              <StatusChip status={video.status} />
            </div>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
              {video.description}
            </p>
          </div>

          <div className="rounded-lg border bg-surface p-4">
            <p className="font-heading text-sm font-semibold">Quick actions</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className={buttonVariants({ className: "gap-2", variant: "outline" })}
                disabled
                type="button"
              >
                <RotateCcw />
                Retry processing
              </button>
              <CopyButton label="Copy source" value={video.sourcePath} />
            </div>
          </div>
        </div>

        {video.processingError && (
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

        <div className="mt-6">
          <PipelineTimeline status={video.status} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <section className="rounded-lg border bg-surface">
            <div className="border-b p-4">
              <h2 className="font-heading text-sm font-semibold">Upload sessions</h2>
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Object key</TableHead>
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
                      <TableCell className="max-w-64 truncate font-mono text-xs">
                        {session.objectKey}
                      </TableCell>
                      <TableCell>
                        {session.uploadedParts.length}/{session.totalParts}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell className="text-muted-foreground" colSpan={3}>
                      No upload session is attached to this dummy record.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </section>

          <section className="rounded-lg border bg-surface">
            <div className="border-b p-4">
              <h2 className="font-heading text-sm font-semibold">Processing runs</h2>
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
                        {run.finishedAt ? formatUpdatedAt(run.finishedAt) : "running"}
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

        <div className="mt-6">
          <RenditionList renditions={renditions} />
        </div>

        <section className="mt-6 rounded-lg border bg-surface p-4">
          <h2 className="font-heading text-sm font-semibold">Copy paths</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            <CopyButton label="Source path" value={video.sourcePath} />
            <CopyButton label="Manifest path" value={video.playbackManifestPath} />
            {renditions.map((rendition) => (
              <CopyButton
                key={rendition.id}
                label={`${rendition.label} playlist`}
                value={rendition.playlistPath}
              />
            ))}
          </div>
        </section>
      </section>
    </main>
  )
}
