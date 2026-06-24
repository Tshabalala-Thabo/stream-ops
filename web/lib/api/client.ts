import type { ApiErrorResponse } from "@/lib/types"

export const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:8000"

function getCookie(name: string) {
  const cookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))

  return cookie ? decodeURIComponent(cookie.split("=")[1]) : null
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

export async function getCsrfCookie() {
  await fetch(`${API_URL}/sanctum/csrf-cookie`, {
    credentials: "include",
  })
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {}
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      Accept: "application/json",
      ...(typeof document !== "undefined" && getCookie("XSRF-TOKEN")
        ? { "X-XSRF-TOKEN": getCookie("XSRF-TOKEN") as string }
        : {}),
      ...(init.body ? { "Content-Type": "application/json" } : {}),
      ...init.headers,
    },
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
