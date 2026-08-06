import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose"

export const COGNITO_ACCESS_TOKEN_COOKIE = "streamops_access_token"
export const COGNITO_ID_TOKEN_COOKIE = "streamops_id_token"
export const COGNITO_REFRESH_TOKEN_COOKIE = "streamops_refresh_token"

export type AuthenticatedCreator = {
  ownerId: string
  subject: string
  email: string | null
  username: string | null
  tokenUse: "access" | "id"
}

type CognitoJwtPayload = JWTPayload & {
  sub?: string
  email?: string
  username?: string
  "cognito:username"?: string
  token_use?: string
  client_id?: string
}

const jwksByIssuer = new Map<string, ReturnType<typeof createRemoteJWKSet>>()

export async function authenticateCognitoRequest(request: Request): Promise<AuthenticatedCreator> {
  const token = getBearerToken(request)
  if (!token) {
    throw new AuthError("Authorization bearer token is required.", "auth_token_required")
  }

  return verifyCognitoJwt(token)
}

export async function verifyCognitoJwt(token: string): Promise<AuthenticatedCreator> {
  const config = getCognitoAuthConfig()
  const { payload } = await jwtVerify(token, getJwks(config.issuer), {
    issuer: config.issuer,
  }).catch((error: unknown) => {
    throw new AuthError("Cognito JWT validation failed.", "auth_token_invalid", error)
  })
  const claims = payload as CognitoJwtPayload
  const tokenUse = claims.token_use

  if (tokenUse !== "access" && tokenUse !== "id") {
    throw new AuthError("Cognito JWT token_use must be access or id.", "auth_token_use_invalid")
  }

  if (tokenUse === "access" && claims.client_id !== config.clientId) {
    throw new AuthError("Cognito access token client_id does not match this app.", "auth_client_invalid")
  }

  if (tokenUse === "id" && claims.aud !== config.clientId) {
    throw new AuthError("Cognito ID token audience does not match this app.", "auth_audience_invalid")
  }

  if (!claims.sub) {
    throw new AuthError("Cognito JWT is missing sub claim.", "auth_subject_missing")
  }

  return {
    ownerId: claims.sub,
    subject: claims.sub,
    email: claims.email ?? null,
    username: claims["cognito:username"] ?? claims.username ?? null,
    tokenUse,
  }
}

export function getBearerToken(request: Request) {
  const header = request.headers.get("authorization")
  if (header) {
    const [scheme, token] = header.split(/\s+/, 2)
    if (scheme?.toLowerCase() === "bearer" && token) {
      return token
    }
  }

  const cookies = parseCookieHeader(request.headers.get("cookie"))
  return cookies.get(COGNITO_ACCESS_TOKEN_COOKIE) ?? cookies.get(COGNITO_ID_TOKEN_COOKIE) ?? null
}

export class AuthError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown
  ) {
    super(message)
    this.name = "AuthError"
  }
}

function getCognitoAuthConfig() {
  const issuer = process.env.COGNITO_ISSUER
  const clientId = process.env.COGNITO_CLIENT_ID

  if (!issuer || !clientId) {
    throw new AuthError("Cognito auth environment is not configured.", "auth_config_missing")
  }

  return { issuer, clientId }
}

function getJwks(issuer: string) {
  const existing = jwksByIssuer.get(issuer)
  if (existing) {
    return existing
  }

  const jwks = createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`))
  jwksByIssuer.set(issuer, jwks)
  return jwks
}

function parseCookieHeader(header: string | null) {
  const cookies = new Map<string, string>()
  if (!header) {
    return cookies
  }

  for (const pair of header.split(";")) {
    const separatorIndex = pair.indexOf("=")
    if (separatorIndex === -1) {
      continue
    }

    const key = pair.slice(0, separatorIndex).trim()
    const value = pair.slice(separatorIndex + 1).trim()
    if (key) {
      cookies.set(key, decodeURIComponent(value))
    }
  }

  return cookies
}
