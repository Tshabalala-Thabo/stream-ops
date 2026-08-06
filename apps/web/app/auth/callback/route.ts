import { NextRequest, NextResponse } from "next/server"

import { logWarn } from "@/lib/logging"
import {
  clearAuthCookies,
  exchangeCodeForTokens,
  getCallbackUrl,
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_RETURN_TO_COOKIE,
  OAUTH_STATE_COOKIE,
  sanitizeReturnTo,
  setAuthTokenCookies,
} from "@/lib/auth/oauth"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  const state = request.nextUrl.searchParams.get("state")
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value
  const codeVerifier = request.cookies.get(OAUTH_CODE_VERIFIER_COOKIE)?.value
  const returnTo = sanitizeReturnTo(request.cookies.get(OAUTH_RETURN_TO_COOKIE)?.value ?? null)

  if (!code || !state || !expectedState || state !== expectedState || !codeVerifier) {
    logWarn("auth.callback.rejected", {
      reason: "invalid_oauth_state",
      hasCode: Boolean(code),
      hasState: Boolean(state),
      hasExpectedState: Boolean(expectedState),
      hasCodeVerifier: Boolean(codeVerifier),
    })
    const response = NextResponse.redirect(new URL("/dashboard?auth=callback_error", request.url))
    clearAuthCookies(response)
    return response
  }

  try {
    const tokens = await exchangeCodeForTokens({
      code,
      codeVerifier,
      redirectUri: getCallbackUrl(request),
    })
    const response = NextResponse.redirect(new URL(returnTo, request.url))

    clearAuthCookies(response)
    setAuthTokenCookies(response, tokens)

    return response
  } catch {
    logWarn("auth.callback.rejected", { reason: "token_exchange_failed" })
    const response = NextResponse.redirect(new URL("/dashboard?auth=token_error", request.url))
    clearAuthCookies(response)
    return response
  }
}
