import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  return workflowJson(async () => {
    if (isAwsWorkflowStore()) {
      const { dynamo } = getAwsWorkflow()
      return dynamo.expireUpload(sessionId, LOCAL_OWNER_ID)
    }

    return getWorkflowStore().expireUpload(sessionId, LOCAL_OWNER_ID)
  })
}
