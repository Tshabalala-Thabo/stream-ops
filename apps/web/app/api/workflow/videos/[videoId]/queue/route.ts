import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return workflowJson(() => getWorkflowStore().queueProcessing(videoId, LOCAL_OWNER_ID))
}
