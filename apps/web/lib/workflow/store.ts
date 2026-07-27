import { InMemoryWorkflowStore } from "@streamops/core"

export const LOCAL_OWNER_ID = "local-creator-1"

const globalForWorkflow = globalThis as typeof globalThis & {
  streamOpsWorkflowStore?: InMemoryWorkflowStore
}

export function getWorkflowStore() {
  globalForWorkflow.streamOpsWorkflowStore ??= new InMemoryWorkflowStore()
  return globalForWorkflow.streamOpsWorkflowStore
}
