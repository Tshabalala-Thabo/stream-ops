import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"
import type { Video, VideoRendition } from "@/lib/types"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return workflowJson(async () => {
    if (isAwsWorkflowStore()) {
      const { dynamo, s3Uploads } = getAwsWorkflow()
      const [video, uploadSessions, processingRuns, renditions] = await Promise.all([
        dynamo.getVideo(videoId, LOCAL_OWNER_ID),
        dynamo.listUploadSessionsForVideo(videoId, LOCAL_OWNER_ID),
        dynamo.listProcessingRuns(videoId, LOCAL_OWNER_ID),
        dynamo.listRenditions(videoId, LOCAL_OWNER_ID),
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
      video: store.getVideo(videoId, LOCAL_OWNER_ID),
      uploadSessions: store
        .listUploadSessions(LOCAL_OWNER_ID)
        .filter((session) => session.videoId === videoId),
      processingRuns: store.listProcessingRuns(videoId, LOCAL_OWNER_ID),
      renditions: store.listRenditions(videoId, LOCAL_OWNER_ID),
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
    renditions: renditionUrls,
  }
}
