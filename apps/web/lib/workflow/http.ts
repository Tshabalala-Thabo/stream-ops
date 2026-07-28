import { NextResponse } from "next/server"

import { WorkflowError } from "@streamops/core"

export async function workflowJson<T>(callback: () => T | Promise<T>) {
  try {
    return NextResponse.json(await callback())
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
