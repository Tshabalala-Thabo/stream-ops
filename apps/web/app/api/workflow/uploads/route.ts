import { DEFAULT_PART_SIZE, validateCreateUploadInput } from "@streamops/core"

import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function GET(request: Request) {
  return authenticatedWorkflowJson(request, (creator) => ({
    uploadSessions: getWorkflowStore().listUploadSessions(creator.ownerId),
  }))
}

export async function POST(request: Request) {
  const payload = await request.json()

  return authenticatedWorkflowJson(request, async (creator) => {
    const uploadInput = {
      ownerId: creator.ownerId,
      title: String(payload.title ?? ""),
      description: payload.description ? String(payload.description) : null,
      fileName: String(payload.fileName ?? ""),
      fileSize: Number(payload.fileSize ?? 0),
      mimeType: String(payload.mimeType ?? ""),
    }

    if (isAwsWorkflowStore()) {
      validateCreateUploadInput(uploadInput)

      const { dynamo, s3Uploads } = getAwsWorkflow()
      const videoId = crypto.randomUUID()
      const uploadSessionId = crypto.randomUUID()
      const objectKey = buildSourceObjectKey(uploadInput.ownerId, videoId, uploadInput.fileName)
      const totalParts = Math.max(1, Math.ceil(uploadInput.fileSize / DEFAULT_PART_SIZE))
      const multipartUploadId = await s3Uploads.createMultipartUpload({
        key: objectKey,
        contentType: uploadInput.mimeType,
        metadata: {
          ownerId: uploadInput.ownerId,
          videoId,
          uploadSessionId,
          originalFileName: uploadInput.fileName,
        },
      })

      let created
      try {
        created = await dynamo.createUpload({
          ...uploadInput,
          videoId,
          uploadSessionId,
          objectKey,
          multipartUploadId,
        })
      } catch (error) {
        await s3Uploads.abortMultipartUpload({ key: objectKey, multipartUploadId }).catch(() => undefined)
        throw error
      }

      const presignedParts = await s3Uploads.presignUploadPartUrls({
        key: objectKey,
        multipartUploadId,
        totalParts,
      })

      return { ...created, presignedParts }
    }

    const created = getWorkflowStore().createUpload({
      ...uploadInput,
    })

    return created
  })
}

function buildSourceObjectKey(ownerId: string, videoId: string, fileName: string) {
  return `source/${ownerId}/${videoId}/${sanitizeFileName(fileName)}`
}

function sanitizeFileName(fileName: string) {
  return fileName.trim().replace(/[^a-zA-Z0-9._-]/g, "-")
}
