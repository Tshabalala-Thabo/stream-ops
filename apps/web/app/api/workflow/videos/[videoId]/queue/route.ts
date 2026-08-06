import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore } from "@/lib/workflow/store"
import { authenticatedWorkflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function POST(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return authenticatedWorkflowJson(request, async (creator) => {
    if (isAwsWorkflowStore()) {
      const { dynamo, getProcessingQueue } = getAwsWorkflow()
      const queued = await dynamo.queueProcessing(videoId, creator.ownerId)

      await getProcessingQueue().sendProcessingJob({
        messageType: "PROCESS_VIDEO",
        videoId: queued.video.id,
        ownerId: queued.video.ownerId,
        processingRunId: queued.run.id,
        sourceKey: queued.video.sourceKey ?? "",
        requestedAt: queued.run.createdAt,
      })

      return queued
    }

    return getWorkflowStore().queueProcessing(videoId, creator.ownerId)
  })
}
