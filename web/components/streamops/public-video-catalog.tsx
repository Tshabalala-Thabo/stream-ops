import { Search } from "lucide-react"

import { EmptyState } from "@/components/streamops/state-panels"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Video } from "@/lib/types"

import { PublicVideoCard } from "./public-video-card"

type PublicVideoCatalogProps = {
  videos: Video[]
  query?: string
  action?: string
}

function matchesPublicQuery(video: Video, query: string) {
  if (!query) {
    return true
  }

  const haystack = [video.title, video.description, video.owner.name]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()

  return haystack.includes(query.toLowerCase())
}

export function PublicVideoCatalog({
  videos,
  query = "",
  action = "/",
}: PublicVideoCatalogProps) {
  const trimmedQuery = query.trim()
  const filteredVideos = videos.filter((video) =>
    matchesPublicQuery(video, trimmedQuery)
  )
  const featuredVideo = filteredVideos[0] ?? null
  const gridVideos = featuredVideo
    ? filteredVideos.filter((video) => video.id !== featuredVideo.id)
    : filteredVideos

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 text-foreground sm:px-6 lg:py-8">
      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
        <div>
          <p className="font-mono text-xs font-medium uppercase text-muted-foreground">
            StreamOps
          </p>
          <h1 className="mt-3 max-w-4xl font-heading text-3xl font-semibold tracking-normal sm:text-4xl">
            Watch the latest videos
          </h1>
          <form
            action={action}
            className="mt-5 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto]"
          >
            <label className="relative min-w-0">
              <span className="sr-only">Search videos</span>
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="h-11 min-w-0 rounded-full pl-9"
                defaultValue={trimmedQuery}
                name="q"
                placeholder="Search videos"
              />
            </label>
            <Button className="h-11 w-fit gap-2 rounded-full px-5" type="submit">
              <Search />
              Search
            </Button>
          </form>
        </div>

        <div className="hidden items-end justify-end lg:flex">
          <p className="max-w-xs text-right text-sm leading-6 text-muted-foreground">
            Public uploads that are ready to play.
          </p>
        </div>
      </section>

      {featuredVideo ? (
        <section className="mt-8">
          <PublicVideoCard video={featuredVideo} priority />
        </section>
      ) : (
        <EmptyState
          className="mt-8"
          title="No videos are ready yet"
          description="Ready videos will appear here as soon as they can be played."
        />
      )}

      {gridVideos.length > 0 && (
        <section className="mt-10">
          <h2 className="font-heading text-xl font-semibold">More to watch</h2>
          <div className="mt-5 grid gap-x-4 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {gridVideos.map((video) => (
              <PublicVideoCard key={video.id} video={video} />
            ))}
          </div>
        </section>
      )}

      {videos.length > 0 && filteredVideos.length === 0 && (
        <EmptyState
          className="mt-8"
          title="No videos match your search"
          description="Try searching by title, description, or creator."
        />
      )}
    </main>
  )
}
