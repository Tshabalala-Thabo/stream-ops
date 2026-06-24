import {
  ArrowRight,
  Clock3,
  Filter,
  Play,
  Search,
  UploadCloud,
} from "lucide-react"
import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const statusRows = [
  {
    title: "Processing",
    detail: "Queued rendition generation",
    meta: "worker.video.transcode",
    color: "bg-info",
  },
  {
    title: "Ready",
    detail: "Manifest available for playback",
    meta: "hls/master.m3u8",
    color: "bg-success",
  },
  {
    title: "Uploading",
    detail: "Direct-to-storage multipart session",
    meta: "s3://streamops/source",
    color: "bg-brand",
  },
]

export default function Home() {
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
            <Link
              className={buttonVariants({ className: "gap-2" })}
              href="/videos"
            >
              Browse videos
              <ArrowRight />
            </Link>
            <Link
              className={buttonVariants({
                className: "gap-2",
                variant: "outline",
              })}
              href="/login?redirectTo=/upload"
            >
              <UploadCloud />
              Sign in to upload
            </Link>
          </div>
        </div>

        <div className="rounded-lg border bg-surface p-4 shadow-sm">
          <div className="flex items-center justify-between gap-4 border-b pb-3">
            <div>
              <p className="font-heading text-sm font-semibold">Catalog queue</p>
              <p className="text-xs text-muted-foreground">
                Public records with pipeline context
              </p>
            </div>
            <span className="rounded-md bg-success-light px-2 py-1 text-xs font-medium text-success-dark">
              Healthy
            </span>
          </div>
          <div className="mt-4 grid gap-3">
            {statusRows.map((row) => (
              <div
                className="grid gap-3 rounded-md border bg-background p-3 sm:grid-cols-[1fr_auto]"
                key={row.title}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", row.color)} />
                    <p className="font-heading text-sm font-semibold">
                      {row.title}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {row.detail}
                  </p>
                </div>
                <p className="self-end truncate font-mono text-xs text-muted-foreground sm:max-w-44">
                  {row.meta}
                </p>
              </div>
            ))}
          </div>
        </div>
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
                Ready, processing, failed
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
            <h2 className="font-heading text-xl font-semibold">Recent activity</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Phase 3 will replace this scaffold with typed dummy video records.
            </p>
          </div>
          <Link
            href="/theme"
            className={buttonVariants({ size: "sm", variant: "outline" })}
          >
            Theme reference
          </Link>
        </div>
        <div className="mt-5 rounded-lg border">
          <div className="grid grid-cols-[1fr_auto] gap-4 border-b p-4 text-sm">
            <div>
              <p className="font-medium">Waiting for catalog data</p>
              <p className="mt-1 text-muted-foreground">
                Dummy videos, upload sessions, and processing runs arrive in the
                next phase.
              </p>
            </div>
            <div className="hidden items-center gap-2 text-muted-foreground sm:flex">
              <Clock3 className="size-4" />
              Phase 3
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
