import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  return authenticatedWorkflowJson(request, async (creator) => {
    if (isAwsWorkflowStore()) {
      const { dynamo } = getAwsWorkflow()
      return dynamo.expireUpload(sessionId, creator.ownerId)
    }

    return getWorkflowStore().expireUpload(sessionId, creator.ownerId)
  })
}
