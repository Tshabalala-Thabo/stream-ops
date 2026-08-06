import { NextRequest, NextResponse } from "next/server"

import { clearAuthCookies, getCognitoOAuthConfig, getRequestOrigin } from "@/lib/auth/oauth"

export function GET(request: NextRequest) {
  const config = getCognitoOAuthConfig()
  const logoutUrl = new URL(`${config.domain}/logout`)

  logoutUrl.searchParams.set("client_id", config.clientId)
  logoutUrl.searchParams.set("logout_uri", getRequestOrigin(request))

  const response = NextResponse.redirect(logoutUrl)
  clearAuthCookies(response)

  return response
}
