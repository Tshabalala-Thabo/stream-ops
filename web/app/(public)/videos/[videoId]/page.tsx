import { Play } from "lucide-react"
import { notFound } from "next/navigation"

import { PublicVideoCard } from "@/components/streamops/public-video-card"
import { formatDuration } from "@/components/streamops/video-format"
import {
  getDummyVideoById,
  getPublicVideos,
  getRelatedPublicVideos,
} from "@/lib/data/dummy-videos"

type VideoDetailPageProps = {
  params: Promise<{ videoId: string }>
}

export function generateStaticParams() {
  return getPublicVideos().map((video) => ({ videoId: video.id.toString() }))
}

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { videoId } = await params
  const video = getDummyVideoById(videoId)

  if (!video || video.status !== "ready" || !video.playbackManifestPath) {
    notFound()
  }

  const relatedVideos = getRelatedPublicVideos(video.id)

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 text-foreground sm:px-6 lg:py-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-foreground text-background shadow-sm">
            {video.thumbnailUrl && (
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-cover bg-center opacity-45"
                style={{ backgroundImage: `url(${video.thumbnailUrl})` }}
              />
            )}
            <div className="absolute inset-0 bg-black/35" />
            <div className="relative grid size-full place-items-center">
              <button
                aria-label={`Play ${video.title}`}
                className="grid size-16 place-items-center rounded-full bg-background text-foreground shadow-lg transition-transform hover:scale-105"
                type="button"
              >
                <Play className="ml-1 size-7 fill-current" />
              </button>
            </div>
            <span className="absolute bottom-3 right-3 rounded bg-black/78 px-2 py-1 font-mono text-xs font-medium text-white">
              {formatDuration(video.durationSeconds)}
            </span>
          </div>

          <div className="mt-5">
            <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
              {video.title}
            </h1>
            <p className="mt-2 text-sm font-medium text-muted-foreground">
              {video.owner.name}
            </p>
            {video.description && (
              <p className="mt-4 max-w-3xl rounded-lg bg-surface-overlay p-4 text-sm leading-6 text-foreground">
                {video.description}
              </p>
            )}
          </div>
        </div>

        <aside className="min-w-0">
          <h2 className="font-heading text-lg font-semibold">More to watch</h2>
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            {relatedVideos.length > 0 ? (
              relatedVideos.map((relatedVideo) => (
                <PublicVideoCard key={relatedVideo.id} video={relatedVideo} />
              ))
            ) : (
              <p className="rounded-lg bg-surface-overlay p-4 text-sm leading-6 text-muted-foreground">
                More videos will appear here as they become ready to play.
              </p>
            )}
          </div>
        </aside>
      </section>
    </main>
  )
}
