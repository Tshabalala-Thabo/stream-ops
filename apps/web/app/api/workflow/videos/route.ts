import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function GET() {
  return workflowJson(async () => {
    if (isAwsWorkflowStore()) {
      const { dynamo } = getAwsWorkflow()
      const [videos, uploadSessions] = await Promise.all([
        dynamo.listVideos(LOCAL_OWNER_ID),
        dynamo.listUploadSessions(LOCAL_OWNER_ID),
      ])

      return { videos, uploadSessions }
    }

    const store = getWorkflowStore()

    return {
      videos: store.listVideos(LOCAL_OWNER_ID),
      uploadSessions: store.listUploadSessions(LOCAL_OWNER_ID),
    }
  })
}
