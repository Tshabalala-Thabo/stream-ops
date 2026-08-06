import { NextRequest, NextResponse } from "next/server"

import {
  createCodeChallenge,
  createCodeVerifier,
  createOAuthState,
  getCallbackUrl,
  getCognitoOAuthConfig,
  OAUTH_CODE_VERIFIER_COOKIE,
  OAUTH_RETURN_TO_COOKIE,
  OAUTH_STATE_COOKIE,
  sanitizeReturnTo,
} from "@/lib/auth/oauth"

export function GET(request: NextRequest) {
  const config = getCognitoOAuthConfig()
  const state = createOAuthState()
  const codeVerifier = createCodeVerifier()
  const returnTo = sanitizeReturnTo(request.nextUrl.searchParams.get("returnTo"))
  const authorizeUrl = new URL(`${config.domain}/oauth2/authorize`)

  authorizeUrl.searchParams.set("client_id", config.clientId)
  authorizeUrl.searchParams.set("code_challenge", createCodeChallenge(codeVerifier))
  authorizeUrl.searchParams.set("code_challenge_method", "S256")
  authorizeUrl.searchParams.set("redirect_uri", getCallbackUrl(request))
  authorizeUrl.searchParams.set("response_type", "code")
  authorizeUrl.searchParams.set("scope", "openid email profile")
  authorizeUrl.searchParams.set("state", state)

  const response = NextResponse.redirect(authorizeUrl)
  const secure = process.env.NODE_ENV === "production"

  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure,
  })
  response.cookies.set(OAUTH_CODE_VERIFIER_COOKIE, codeVerifier, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure,
  })
  response.cookies.set(OAUTH_RETURN_TO_COOKIE, returnTo, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/",
    sameSite: "lax",
    secure,
  })

  return response
}
