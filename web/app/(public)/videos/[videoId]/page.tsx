import { notFound } from "next/navigation"

import { PublicVideoCard } from "@/components/streamops/public-video-card"
import { StreamOpsPlayer } from "@/components/streamops/streamops-player"
import {
  getPublicVideo,
  getPublicVideoRenditions,
  getRelatedPublicVideos,
} from "@/lib/api/videos"

type VideoDetailPageProps = {
  params: Promise<{ videoId: string }>
}

export const dynamic = "force-dynamic"

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { videoId } = await params
  const video = await getPublicVideo(videoId).catch(() => null)

  if (!video) {
    notFound()
  }

  const relatedVideos = await getRelatedPublicVideos(video.id).catch(() => [])
  const renditions = await getPublicVideoRenditions(video.id).catch(() => [])

  return (
    <main className="mx-auto w-full max-w-7xl px-4 py-6 text-foreground sm:px-6 lg:py-8">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <StreamOpsPlayer renditions={renditions} video={video} />

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
