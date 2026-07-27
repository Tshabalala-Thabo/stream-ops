import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  const store = getWorkflowStore()

  return workflowJson(() => ({
    video: store.getVideo(videoId, LOCAL_OWNER_ID),
    uploadSessions: store
      .listUploadSessions(LOCAL_OWNER_ID)
      .filter((session) => session.videoId === videoId),
    processingRuns: store.listProcessingRuns(videoId, LOCAL_OWNER_ID),
    renditions: store.listRenditions(videoId, LOCAL_OWNER_ID),
  }))
}
