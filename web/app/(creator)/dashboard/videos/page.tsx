import { ExternalLink, RotateCcw } from "lucide-react"
import Link from "next/link"

import { StatusChip } from "@/components/streamops/status-chip"
import {
  formatDuration,
  formatResolution,
  formatUpdatedAt,
} from "@/components/streamops/video-format"
import { buttonVariants } from "@/components/ui/button"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { getDummyVideos } from "@/lib/data/dummy-videos"

export default function DashboardVideosPage() {
  const videos = getDummyVideos()

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
              Operational view of dummy video records with status, source paths,
              manifest readiness, and retry controls.
            </p>
          </div>
          <Link className={buttonVariants({ variant: "outline" })} href="/videos">
            Public catalog
          </Link>
        </div>

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
              {videos.map((video) => (
                <TableRow key={video.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{video.title}</p>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
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
