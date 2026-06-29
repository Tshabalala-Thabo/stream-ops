import type { ApiErrorResponse } from "@/lib/types"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

export function getCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null
}

export function getXsrfToken() {
  return typeof document !== "undefined" ? getCookie("XSRF-TOKEN") : null
}

export class ApiError extends Error {
  status: number
  errors?: ApiErrorResponse["errors"]

  constructor(message: string, status: number, errors?: ApiErrorResponse["errors"]) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.errors = errors
  }
}

function createApiHeaders(initHeaders?: HeadersInit, hasBody = false): Headers {
  const headers = new Headers(initHeaders)

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (!headers.has("X-Requested-With")) {
    headers.set("X-Requested-With", "XMLHttpRequest")
  }

  if (hasBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json")
  }

  const xsrfToken = getXsrfToken()

  if (xsrfToken && !headers.has("X-XSRF-TOKEN")) {
    headers.set("X-XSRF-TOKEN", xsrfToken)
  }

  return headers
}

export async function getCsrfCookie() {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
    headers: createApiHeaders(),
  })
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: createApiHeaders(init.headers, Boolean(init.body)),
  })

  if (response.status === 204) {
    return undefined as T
  }

  const contentType = response.headers.get("content-type")
  const data = contentType?.includes("application/json")
    ? ((await response.json()) as T | ApiErrorResponse)
    : undefined

  if (!response.ok) {
    const errorData = data as ApiErrorResponse | undefined

    throw new ApiError(
      errorData?.message ?? "Request failed",
      response.status,
      errorData?.errors
    )
  }

  return data as T
}
