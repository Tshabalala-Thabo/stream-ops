import { PublicVideoCatalog } from "@/components/streamops/public-video-catalog"
import { getPublicVideos } from "@/lib/data/dummy-videos"

type VideosPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams

  return (
    <PublicVideoCatalog action="/videos" query={params.q} videos={getPublicVideos()} />
  )
}
