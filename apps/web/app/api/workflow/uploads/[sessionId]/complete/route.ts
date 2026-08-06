import { WorkflowError, type UploadedPart } from "@streamops/core"

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
      const { dynamo, s3Uploads } = getAwsWorkflow()
      const payload = await request.json().catch(() => ({}))
      const parts = parseUploadedParts(payload.parts)
      const session = await dynamo.getUploadSession(sessionId, creator.ownerId)

      await s3Uploads.completeMultipartUpload({
        key: session.objectKey,
        multipartUploadId: session.multipartUploadId,
        parts,
      })

      return dynamo.completeUpload(sessionId, creator.ownerId, parts)
    }

    return getWorkflowStore().completeUpload(sessionId, creator.ownerId)
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
