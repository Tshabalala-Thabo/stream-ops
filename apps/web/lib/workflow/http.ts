import { NextResponse } from "next/server"

import { WorkflowError, safeErrorForLog } from "@streamops/core"

import {
  AuthError,
  authenticateCognitoRequest,
  type AuthenticatedCreator,
} from "@/lib/auth/cognito"
import { logUnexpectedError, logWarn } from "@/lib/logging"

export async function workflowJson<T>(callback: () => T | Promise<T>) {
  try {
    return NextResponse.json(await callback())
  } catch (error) {
    if (error instanceof WorkflowError) {
      logWarn("workflow.request.rejected", { errorCode: error.code })
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.code.endsWith("_not_found") ? 404 : 400 }
      )
    }

    return unexpectedWorkflowError(error)
  }
}

export async function authenticatedWorkflowJson<T>(
  request: Request,
  callback: (creator: AuthenticatedCreator) => T | Promise<T>
) {
  try {
    const creator = await authenticateCognitoRequest(request)
    return NextResponse.json(await callback(creator))
  } catch (error) {
    if (error instanceof AuthError) {
      logWarn("workflow.auth.rejected", { errorCode: error.code })
      return NextResponse.json(
        { authenticated: false, code: error.code, message: error.message },
        { status: 401 }
      )
    }

    if (error instanceof WorkflowError) {
      logWarn("workflow.request.rejected", { errorCode: error.code })
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.code.endsWith("_not_found") ? 404 : 400 }
      )
    }

    return unexpectedWorkflowError(error)
  }
}

function unexpectedWorkflowError(error: unknown) {
  logUnexpectedError("workflow.unexpected_error", error)
  const safeError = safeErrorForLog(error)

  return NextResponse.json(
    {
      code: "workflow_unexpected_error",
      message: "Workflow request failed unexpectedly.",
      errorName: safeError.name,
    },
    { status: 500 }
  )
}
