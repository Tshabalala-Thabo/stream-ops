import { NextResponse } from "next/server"

import { WorkflowError } from "@streamops/core"

export function workflowJson<T>(callback: () => T) {
  try {
    return NextResponse.json(callback())
  } catch (error) {
    if (error instanceof WorkflowError) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.code.endsWith("_not_found") ? 404 : 400 }
      )
    }

    throw error
  }
}
