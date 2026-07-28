import { getAwsWorkflow } from "@/lib/workflow/aws"
import { getWorkflowStore, LOCAL_OWNER_ID } from "@/lib/workflow/store"
import { workflowJson } from "@/lib/workflow/http"
import { isAwsWorkflowStore } from "@/lib/workflow/store"

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> }
) {
  const { videoId } = await params

  return workflowJson(async () => {
    if (isAwsWorkflowStore()) {
      const { dynamo, getProcessingQueue } = getAwsWorkflow()
      const queued = await dynamo.queueProcessing(videoId, LOCAL_OWNER_ID)

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

    return getWorkflowStore().queueProcessing(videoId, LOCAL_OWNER_ID)
  })
}
