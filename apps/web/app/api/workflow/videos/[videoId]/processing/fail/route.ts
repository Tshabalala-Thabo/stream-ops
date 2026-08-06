import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  const payload = await request.json().catch(() => ({}))

  return authenticatedWorkflowJson(request, (creator) =>
    getWorkflowStore().failProcessing(
      videoId,
      creator.ownerId,
      String(payload.error ?? "Local worker simulation failed while generating renditions.")
    )
  )
}
