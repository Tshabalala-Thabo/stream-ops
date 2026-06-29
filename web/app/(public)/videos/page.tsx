import { Filter, Search } from "lucide-react"
import Link from "next/link"

import { EmptyState } from "@/components/streamops/state-panels"
import { StatusChip } from "@/components/streamops/status-chip"
import { VideoCard } from "@/components/streamops/video-card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getDummyVideos } from "@/lib/data/dummy-videos"
import type { VideoStatus } from "@/lib/types"
import { cn } from "@/lib/utils"

const filterStatuses = ["ready", "processing", "queued", "failed"] satisfies VideoStatus[]
type FilterStatus = (typeof filterStatuses)[number]

type VideosPageProps = {
  searchParams: Promise<{
    q?: string
    status?: string
  }>
}

function matchesQuery(video: ReturnType<typeof getDummyVideos>[number], query: string) {
  if (!query) {
    return true
  }

  const haystack = [
    video.title,
    video.description,
    video.owner.name,
    video.sourcePath,
    video.playbackManifestPath,
    video.thumbnailPath,
    video.id.toString(),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams
  const query = params.q?.trim() ?? ""
  const selectedStatus = filterStatuses.includes(params.status as FilterStatus)
    ? (params.status as FilterStatus)
    : "all"

  const videos = getDummyVideos()
  const filteredVideos = videos.filter((video) => {
    const statusMatches = selectedStatus === "all" || video.status === selectedStatus

    return statusMatches && matchesQuery(video, query)
  })

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="flex flex-col gap-5 border-b pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            Public browse
          </p>
          <h1 className="mt-3 font-heading text-3xl font-semibold">
            Video catalog
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Browse public StreamOps records by status, owner, source object, or
            playback manifest. All data is dummy until backend endpoints arrive.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <StatusChip status="ready" />
          <StatusChip status="processing" />
        </div>
      </div>

      <form className="mt-6 grid gap-3 rounded-lg border bg-surface p-4 md:grid-cols-[1fr_auto]" action="/videos">
        <label className="relative">
          <span className="sr-only">Search videos</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            defaultValue={query}
            name="q"
            placeholder="Search title, owner, object key, manifest..."
          />
        </label>
        {selectedStatus !== "all" && (
          <input name="status" type="hidden" value={selectedStatus} />
        )}
        <Button className="gap-2" type="submit">
          <Search />
          Search
        </Button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="size-4" />
          Status
        </span>
        <Link
          className={buttonVariants({
            className: cn(selectedStatus === "all" && "bg-muted text-foreground"),
            size: "sm",
            variant: "outline",
          })}
          href={query ? `/videos?q=${encodeURIComponent(query)}` : "/videos"}
        >
          All
        </Link>
        {filterStatuses.map((status) => (
          <Link
            className={buttonVariants({
              className: cn(selectedStatus === status && "bg-muted text-foreground"),
              size: "sm",
              variant: "outline",
            })}
            href={`/videos?status=${status}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
            key={status}
          >
            {status}
          </Link>
        ))}
      </div>

      {filteredVideos.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredVideos.map((video) => (
            <VideoCard href={`/videos/${video.id}`} key={video.id} video={video} />
          ))}
        </div>
      ) : (
        <EmptyState
          className="mt-6"
          title="No videos match this view"
          description="Try a different status filter or search term. The dummy catalog intentionally covers every core media pipeline status."
        />
      )}
    </div>
  )
}
