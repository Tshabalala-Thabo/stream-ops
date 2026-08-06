import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function GET(request: Request) {
  return authenticatedWorkflowJson(request, async (creator) => {
    if (isAwsWorkflowStore()) {
      const { dynamo } = getAwsWorkflow()
      const [videos, uploadSessions] = await Promise.all([
        dynamo.listVideos(creator.ownerId),
        dynamo.listUploadSessions(creator.ownerId),
      ])

      return { videos, uploadSessions }
    }

    const store = getWorkflowStore()

    return {
      videos: store.listVideos(creator.ownerId),
      uploadSessions: store.listUploadSessions(creator.ownerId),
    }
  })
}
