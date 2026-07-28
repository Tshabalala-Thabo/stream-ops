import { WorkflowError, type UploadedPart } from "@streamops/core"

import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const { sessionId } = await params

  return workflowJson(async () => {
    if (isAwsWorkflowStore()) {
      const { dynamo, s3Uploads } = getAwsWorkflow()
      const payload = await request.json().catch(() => ({}))
      const parts = parseUploadedParts(payload.parts)
      const session = await dynamo.getUploadSession(sessionId, LOCAL_OWNER_ID)

      await s3Uploads.completeMultipartUpload({
        key: session.objectKey,
        multipartUploadId: session.multipartUploadId,
        parts,
      })

      return dynamo.completeUpload(sessionId, LOCAL_OWNER_ID, parts)
    }

    return getWorkflowStore().completeUpload(sessionId, LOCAL_OWNER_ID)
  })
}

function parseUploadedParts(value: unknown): UploadedPart[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new WorkflowError("Uploaded part metadata is required.", "uploaded_parts_required")
  }

  return value.map((part) => {
    const candidate = part as Partial<UploadedPart>

    return {
      partNumber: Number(candidate.partNumber),
      etag: String(candidate.etag ?? ""),
      size: Number(candidate.size),
    }
  })
}
