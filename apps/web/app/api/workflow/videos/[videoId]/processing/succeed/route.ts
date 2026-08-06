import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return authenticatedWorkflowJson(request, (creator) =>
    getWorkflowStore().completeProcessing(videoId, creator.ownerId)
  )
}
