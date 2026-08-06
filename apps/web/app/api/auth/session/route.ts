import { NextResponse } from "next/server"

import { AuthError, authenticateCognitoRequest } from "@/lib/auth/cognito"
import { logWarn } from "@/lib/logging"

export async function GET(request: Request) {
  try {
    const creator = await authenticateCognitoRequest(request)

    return NextResponse.json({
      authenticated: true,
      ownerId: creator.ownerId,
      subject: creator.subject,
      email: creator.email,
      username: creator.username,
      tokenUse: creator.tokenUse,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      logWarn("auth.session.rejected", { errorCode: error.code })
      return NextResponse.json(
        { authenticated: false, code: error.code, message: error.message },
        { status: 401 }
      )
    }

    throw error
  }
}
