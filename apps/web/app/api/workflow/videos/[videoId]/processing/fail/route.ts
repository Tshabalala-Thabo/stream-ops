import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params
  const payload = await request.json().catch(() => ({}))

  return workflowJson(() =>
    getWorkflowStore().failProcessing(
      videoId,
      LOCAL_OWNER_ID,
      String(payload.error ?? "Local worker simulation failed while generating renditions.")
    )
  )
}
