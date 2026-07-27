import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"

export async function GET() {
  const store = getWorkflowStore()

  return workflowJson(() => ({
    videos: store.listVideos(LOCAL_OWNER_ID),
    uploadSessions: store.listUploadSessions(LOCAL_OWNER_ID),
  }))
}
