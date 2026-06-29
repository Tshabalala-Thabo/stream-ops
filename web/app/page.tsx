import { PublicVideoCatalog } from "@/components/streamops/public-video-catalog"
import { getPublicVideos } from "@/lib/data/dummy-videos"

type HomePageProps = {
  searchParams: Promise<{
    q?: string
  }>
}

export default async function Home({ searchParams }: HomePageProps) {
  const params = await searchParams

  return <PublicVideoCatalog query={params.q} videos={getPublicVideos()} />
}
