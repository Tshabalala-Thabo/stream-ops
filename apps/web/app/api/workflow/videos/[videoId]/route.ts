import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"
import type { Video, VideoRendition } from "@/lib/types"

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return authenticatedWorkflowJson(request, async (creator) => {
    if (isAwsWorkflowStore()) {
      const { dynamo, s3Uploads } = getAwsWorkflow()
      const [video, uploadSessions, processingRuns, renditions] = await Promise.all([
        dynamo.getVideo(videoId, creator.ownerId),
        dynamo.listUploadSessionsForVideo(videoId, creator.ownerId),
        dynamo.listProcessingRuns(videoId, creator.ownerId),
        dynamo.listRenditions(videoId, creator.ownerId),
      ])

      return {
        video,
        uploadSessions,
        processingRuns,
        renditions,
        assetAccess: await createAssetAccess(s3Uploads, video, renditions),
      }
    }

    const store = getWorkflowStore()

    return {
      video: store.getVideo(videoId, creator.ownerId),
      uploadSessions: store
        .listUploadSessions(creator.ownerId)
        .filter((session) => session.videoId === videoId),
      processingRuns: store.listProcessingRuns(videoId, creator.ownerId),
      renditions: store.listRenditions(videoId, creator.ownerId),
      assetAccess: null,
    }
  })
}

async function createAssetAccess(
  s3: ReturnType<typeof getAwsWorkflow>["s3Uploads"],
  video: Video,
  renditions: VideoRendition[]
) {
  const [thumbnailUrl, playbackManifestUrl, renditionUrls] = await Promise.all([
    video.thumbnailKey ? s3.presignGetObjectUrl({ key: video.thumbnailKey }) : null,
    video.playbackManifestKey ? s3.presignGetObjectUrl({ key: video.playbackManifestKey }) : null,
    Promise.all(
      renditions.map(async (rendition) => ({
        label: rendition.label,
        playlistUrl: await s3.presignGetObjectUrl({ key: rendition.playlistKey }),
      }))
    ),
  ])

  return {
    thumbnailUrl,
    playbackManifestUrl,
    playbackProxyUrl: `/api/playback/${video.id}/hls/master.m3u8`,
    renditions: renditionUrls,
  }
}
