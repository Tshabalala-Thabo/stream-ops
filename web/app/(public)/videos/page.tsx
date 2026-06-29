import { PublicVideoCatalog } from "@/components/streamops/public-video-catalog"
import { getPublicVideos } from "@/lib/api/videos"

export const dynamic = "force-dynamic"

type VideosPageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

async function loadPublicCatalog(query: string) {
  try {
    return {
      isUnavailable: false,
      videos: await getPublicVideos(query),
    }
  } catch {
    return {
      isUnavailable: true,
      videos: [],
    }
  }
}

export default async function VideosPage({ searchParams }: VideosPageProps) {
  const params = await searchParams
  const query = params.q ?? ""
  const catalog = await loadPublicCatalog(query)

  return (
    <PublicVideoCatalog
      action="/videos"
      isUnavailable={catalog.isUnavailable}
      query={query}
      videos={catalog.videos}
    />
  )
}
