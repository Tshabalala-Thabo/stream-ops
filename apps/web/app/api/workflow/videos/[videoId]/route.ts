import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return workflowJson(async () => {
    if (isAwsWorkflowStore()) {
      const { dynamo } = getAwsWorkflow()
      const [video, uploadSessions] = await Promise.all([
        dynamo.getVideo(videoId, LOCAL_OWNER_ID),
        dynamo.listUploadSessionsForVideo(videoId, LOCAL_OWNER_ID),
      ])

      return {
        video,
        uploadSessions,
        processingRuns: await dynamo.listProcessingRuns(videoId, LOCAL_OWNER_ID),
        renditions: await dynamo.listRenditions(videoId, LOCAL_OWNER_ID),
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
    }
  })
}
