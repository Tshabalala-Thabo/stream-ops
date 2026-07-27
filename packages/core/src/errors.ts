export class WorkflowError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message)
    this.name = "WorkflowError"
  }
}

export function assertWorkflow(condition: unknown, message: string, code: string) {
  if (!condition) {
    throw new WorkflowError(message, code)
  }
}
