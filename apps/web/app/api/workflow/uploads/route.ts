import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"

export async function GET() {
  return workflowJson(() => ({
    uploadSessions: getWorkflowStore().listUploadSessions(LOCAL_OWNER_ID),
  }))
}

export async function POST(request: Request) {
  const payload = await request.json()

  return workflowJson(() => {
    const created = getWorkflowStore().createUpload({
      ownerId: LOCAL_OWNER_ID,
      title: String(payload.title ?? ""),
      description: payload.description ? String(payload.description) : null,
      fileName: String(payload.fileName ?? ""),
      fileSize: Number(payload.fileSize ?? 0),
      mimeType: String(payload.mimeType ?? ""),
    })

    return created
  })
}
