import { VideoDetailClient } from "@/components/streamops/video-detail-client"

export default async function VideoDetailPage({
  params,
}: {
  params: Promise<{ videoId: string }>
}) {
  const { videoId } = await params

  return <VideoDetailClient videoId={videoId} />
}
