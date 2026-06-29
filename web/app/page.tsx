import { PublicVideoCatalog } from "@/components/streamops/public-video-catalog"
import { getPublicVideos } from "@/lib/api/videos"

export const dynamic = "force-dynamic"

type HomePageProps = {
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

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams
  const query = params.q ?? ""
  const catalog = await loadPublicCatalog(query)

  return (
    <PublicVideoCatalog
      isUnavailable={catalog.isUnavailable}
      query={query}
      videos={catalog.videos}
    />
  )
}
