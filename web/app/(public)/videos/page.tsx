import { PublicVideoCatalog } from "@/components/streamops/public-video-catalog"
import { getPublicVideos } from "@/lib/api/videos"

export const dynamic = "force-dynamic"

type VideosPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams
  const query = params.q ?? ""

  try {
    const videos = await getPublicVideos(query)

    return <PublicVideoCatalog action="/videos" query={query} videos={videos} />
  } catch {
    return (
      <PublicVideoCatalog action="/videos" isUnavailable query={query} videos={[]} />
    )
  }
}
