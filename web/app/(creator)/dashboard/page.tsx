import { Activity, CheckCircle2, Clock3, UploadCloud, XCircle } from "lucide-react"
import Link from "next/link"

import { PipelineTimeline } from "@/components/streamops/pipeline-timeline"
import { StatusChip } from "@/components/streamops/status-chip"
import { formatUpdatedAt } from "@/components/streamops/video-format"
import { buttonVariants } from "@/components/ui/button"
import {
  dummyUploadSessions,
  getDummyVideos,
} from "@/lib/data/dummy-videos"

const metricCards = [
  {
    label: "Uploaded",
    icon: UploadCloud,
    getValue: () => getDummyVideos().filter((video) => video.sourcePath).length,
  },
  {
    label: "Processing",
    icon: Activity,
    getValue: () =>
      getDummyVideos().filter((video) => video.status === "processing").length,
  },
  {
    label: "Ready",
    icon: CheckCircle2,
    getValue: () => getDummyVideos().filter((video) => video.status === "ready").length,
  },
  {
    label: "Failed",
    icon: XCircle,
    getValue: () => getDummyVideos().filter((video) => video.status === "failed").length,
  },
  {
    label: "Active uploads",
    icon: Clock3,
    getValue: () =>
      dummyUploadSessions.filter((session) => session.status === "active").length,
  },
]

export default function DashboardPage() {
  const videos = getDummyVideos()
  const activeVideo =
    videos.find((video) => video.status === "processing") ??
    videos.find((video) => video.status === "ready") ??
    videos[0]

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
              Dummy aggregates show how the creator overview will read once
              video APIs are wired.
            </p>
          </div>
          <Link className={buttonVariants({ className: "gap-2 bg-gradient-primary text-white" })} href="/upload">
            <UploadCloud />
            Create upload
          </Link>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-5">
          {metricCards.map((metric) => {
            const Icon = metric.icon

            return (
              <div className="rounded-lg border bg-surface p-4" key={metric.label}>
                <Icon className="size-4 text-primary" />
                <p className="mt-4 text-3xl font-semibold">{metric.getValue()}</p>
                <p className="text-sm text-muted-foreground">{metric.label}</p>
              </div>
            )
          })}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
          <PipelineTimeline
            className="bg-gradient-processing text-white [&_.text-muted-foreground]:text-white/70"
            status={activeVideo.status}
          />

          <section className="rounded-lg border bg-gradient-ready p-4 text-brand-accent-foreground">
            <p className="font-heading text-sm font-semibold">Ready-state summary</p>
            <p className="mt-3 text-3xl font-semibold">
              {videos.filter((video) => video.status === "ready").length}
            </p>
            <p className="mt-2 text-sm">
              Videos currently expose playback manifests and rendition playlists.
            </p>
          </section>
        </div>

        <section className="mt-6 rounded-lg border bg-surface">
          <div className="flex items-center justify-between gap-4 border-b p-4">
            <h2 className="font-heading text-sm font-semibold">Recent uploads</h2>
            <Link className={buttonVariants({ size: "sm", variant: "outline" })} href="/dashboard/videos">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {videos.slice(0, 5).map((video) => (
              <Link
                className="grid gap-3 p-4 text-sm transition-colors hover:bg-muted/50 md:grid-cols-[1fr_auto_auto]"
                href={`/dashboard/videos/${video.id}`}
                key={video.id}
              >
                <div>
                  <p className="font-medium">{video.title}</p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">
                    {video.sourcePath ?? "source pending"}
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
