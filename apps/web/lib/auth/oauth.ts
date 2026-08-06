import { createHash, randomBytes } from "node:crypto"

import type { NextRequest, NextResponse } from "next/server"

import {
  COGNITO_ACCESS_TOKEN_COOKIE,
  COGNITO_ID_TOKEN_COOKIE,
  COGNITO_REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/cognito"

export const OAUTH_STATE_COOKIE = "streamops_oauth_state"
export const OAUTH_CODE_VERIFIER_COOKIE = "streamops_oauth_code_verifier"
export const OAUTH_RETURN_TO_COOKIE = "streamops_oauth_return_to"

export type CognitoTokenResponse = {
  access_token: string
  expires_in: number
  id_token: string
  refresh_token?: string
  token_type: string
}

export function getCognitoOAuthConfig() {
  const clientId = process.env.COGNITO_CLIENT_ID
  const domain = process.env.COGNITO_DOMAIN

  if (!clientId || !domain) {
    throw new Error("COGNITO_CLIENT_ID and COGNITO_DOMAIN are required for Cognito sign-in.")
  }

  return {
    clientId,
    domain: domain.replace(/\/$/, ""),
  }
}

export function getRequestOrigin(request: NextRequest) {
  const forwardedProto = request.headers.get("x-forwarded-proto")
  const forwardedHost = request.headers.get("x-forwarded-host")

  if (forwardedProto && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`
  }

  return request.nextUrl.origin
}

export function getCallbackUrl(request: NextRequest) {
  return `${getRequestOrigin(request)}/auth/callback`
}

export function createOAuthState() {
  return base64Url(randomBytes(32))
}

export function createCodeVerifier() {
  return base64Url(randomBytes(64))
}

export function createCodeChallenge(verifier: string) {
  return base64Url(createHash("sha256").update(verifier).digest())
}

export function sanitizeReturnTo(value: string | null) {
  if (!value?.startsWith("/") || value.startsWith("//")) {
    return "/dashboard"
  }

  return value
}

export async function exchangeCodeForTokens(input: {
  code: string
  codeVerifier: string
  redirectUri: string
}) {
  const config = getCognitoOAuthConfig()
  const body = new URLSearchParams({
    client_id: config.clientId,
    code: input.code,
    code_verifier: input.codeVerifier,
    grant_type: "authorization_code",
    redirect_uri: input.redirectUri,
  })

  const response = await fetch(`${config.domain}/oauth2/token`, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded",
    },
    body,
  })

  if (!response.ok) {
    throw new Error(`Cognito token exchange failed with HTTP ${response.status}.`)
  }

  return (await response.json()) as CognitoTokenResponse
}

export function setAuthTokenCookies(response: NextResponse, tokens: CognitoTokenResponse) {
  const secure = process.env.NODE_ENV === "production"
  const maxAge = Math.max(tokens.expires_in - 30, 60)

  response.cookies.set(COGNITO_ACCESS_TOKEN_COOKIE, tokens.access_token, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure,
  })
  response.cookies.set(COGNITO_ID_TOKEN_COOKIE, tokens.id_token, {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite: "lax",
    secure,
  })

  if (tokens.refresh_token) {
    response.cookies.set(COGNITO_REFRESH_TOKEN_COOKIE, tokens.refresh_token, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
      sameSite: "lax",
      secure,
    })
  }
}

export function clearAuthCookies(response: NextResponse) {
  for (const name of [
    COGNITO_ACCESS_TOKEN_COOKIE,
    COGNITO_ID_TOKEN_COOKIE,
    COGNITO_REFRESH_TOKEN_COOKIE,
    OAUTH_STATE_COOKIE,
    OAUTH_CODE_VERIFIER_COOKIE,
    OAUTH_RETURN_TO_COOKIE,
  ]) {
    response.cookies.set(name, "", {
      httpOnly: true,
      maxAge: 0,
      path: "/",
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    })
  }
}

function base64Url(value: Buffer) {
  return value.toString("base64url")
}
