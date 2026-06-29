import { ArrowRight, Clock3, Filter, Play, Search, UploadCloud } from "lucide-react"
import Link from "next/link"

import { StatusChip } from "@/components/streamops/status-chip"
import { VideoCard } from "@/components/streamops/video-card"
import { formatResolution, formatUpdatedAt } from "@/components/streamops/video-format"
import { buttonVariants } from "@/components/ui/button"
import { getDummyVideos } from "@/lib/data/dummy-videos"

export default function Home() {
  const videos = getDummyVideos()
  const featured = videos.find((video) => video.status === "ready") ?? videos[0]
  const recentVideos = videos.slice(0, 3)

  return (
    <div className="bg-background text-foreground">
      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:py-14">
        <div className="flex flex-col justify-center">
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            Public video library
          </p>
          <h1 className="mt-4 max-w-3xl font-heading text-4xl font-semibold tracking-normal sm:text-5xl">
            Browse public videos and inspect the media pipeline behind them.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-muted-foreground">
            StreamOps keeps playback public while authenticated creators manage
            uploads, processing, renditions, and readiness from the same shell.
          </p>
          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link className={buttonVariants({ className: "gap-2" })} href="/videos">
              Browse videos
              <ArrowRight />
            </Link>
            <Link
              className={buttonVariants({ className: "gap-2", variant: "outline" })}
              href="/login?redirectTo=/upload"
            >
              <UploadCloud />
              Sign in to upload
            </Link>
          </div>
        </div>

        <Link
          href={`/videos/${featured.id}`}
          className="overflow-hidden rounded-lg border bg-surface shadow-sm transition-colors hover:border-primary/35"
        >
          <div className="aspect-video bg-gradient-dark-glow">
            {featured.thumbnailUrl ? (
              <div
                className="size-full bg-cover bg-center"
                style={{ backgroundImage: `url(${featured.thumbnailUrl})` }}
              />
            ) : null}
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between gap-4">
              <StatusChip status={featured.status} />
              <span className="font-mono text-xs text-muted-foreground">
                {formatResolution(featured)}
              </span>
            </div>
            <h2 className="mt-3 font-heading text-xl font-semibold">
              {featured.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {featured.description}
            </p>
            <p className="mt-4 font-mono text-xs text-muted-foreground">
              Updated {formatUpdatedAt(featured.updatedAt)}
            </p>
          </div>
        </Link>
      </section>

      <section className="border-y bg-surface-overlay">
        <div className="mx-auto grid max-w-7xl gap-4 px-4 py-6 sm:px-6 md:grid-cols-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-info-light text-info-dark">
              <Search className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Search-ready catalog</p>
              <p className="text-xs text-muted-foreground">Title, owner, status</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-warning-light text-warning-dark">
              <Filter className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Operational filters</p>
              <p className="text-xs text-muted-foreground">
                Ready, processing, queued, failed
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-md bg-success-light text-success-dark">
              <Play className="size-4" />
            </span>
            <div>
              <p className="text-sm font-medium">Playback-first detail</p>
              <p className="text-xs text-muted-foreground">
                Manifest and renditions
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-heading text-xl font-semibold">Recent uploads</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Dummy catalog records covering every planned pipeline state.
            </p>
          </div>
          <div className="hidden items-center gap-2 text-sm text-muted-foreground sm:flex">
            <Clock3 className="size-4" />
            {videos.length} records
          </div>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {recentVideos.map((video) => (
            <VideoCard href={`/videos/${video.id}`} key={video.id} video={video} />
          ))}
        </div>
      </section>
    </div>
  )
}
