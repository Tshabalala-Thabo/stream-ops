import { PublicVideoCatalog } from "@/components/streamops/public-video-catalog"
import { getPublicVideos } from "@/lib/api/videos"

export const dynamic = "force-dynamic"

type HomePageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams
  const query = params.q ?? ""

  try {
    const videos = await getPublicVideos(query)

    return <PublicVideoCatalog query={query} videos={videos} />
  } catch {
    return <PublicVideoCatalog isUnavailable query={query} videos={[]} />
  }
}
