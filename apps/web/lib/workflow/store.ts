import { InMemoryWorkflowStore } from "@streamops/core"

export const LOCAL_OWNER_ID = "local-creator-1"
export const WORKFLOW_STORE_MODE = process.env.WORKFLOW_STORE ?? "memory"

const globalForWorkflow = globalThis as typeof globalThis & {
  streamOpsWorkflowStore?: InMemoryWorkflowStore
}

export function getWorkflowStore() {
  globalForWorkflow.streamOpsWorkflowStore ??= new InMemoryWorkflowStore()
  return globalForWorkflow.streamOpsWorkflowStore
}

export function isAwsWorkflowStore() {
  return WORKFLOW_STORE_MODE === "aws"
}
