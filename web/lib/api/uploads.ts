import {
  API_URL,
  ApiError,
  apiFetch,
  getCsrfCookie,
  getXsrfToken,
} from "@/lib/api/client"
import type { UploadSession } from "@/lib/types"

type ApiResource<T> = {
  data: T
}

export type CreateUploadSessionPayload = {
  title: string
  description: string | null
  fileName: string
  fileSize: number
  mimeType: string
}

export async function createUploadSession(
  payload: CreateUploadSessionPayload
): Promise<UploadSession> {
  await getCsrfCookie()

  const response = await apiFetch<ApiResource<UploadSession>>("/api/uploads", {
    method: "POST",
    body: JSON.stringify(payload),
  })

  return response.data
}

export async function completeUploadSession(
  uploadSessionId: UploadSession["id"]
): Promise<UploadSession> {
  const response = await apiFetch<ApiResource<UploadSession>>(
    `/api/uploads/${uploadSessionId}/complete`,
    {
      method: "POST",
    }
  )

  return response.data
}

export async function getUploadSession(
  uploadSessionId: UploadSession["id"]
): Promise<UploadSession> {
  const response = await apiFetch<ApiResource<UploadSession>>(
    `/api/uploads/${uploadSessionId}`
  )

  return response.data
}

export async function abortUploadSession(
  uploadSessionId: UploadSession["id"]
): Promise<UploadSession> {
  const response = await apiFetch<ApiResource<UploadSession>>(
    `/api/uploads/${uploadSessionId}/abort`,
    {
      method: "POST",
    }
  )

  return response.data
}

export function uploadUploadSessionPart({
  uploadSessionId,
  partNumber,
  chunk,
  onProgress,
  signal,
}: {
  uploadSessionId: UploadSession["id"]
  partNumber: number
  chunk: Blob
  onProgress?: (uploadedBytes: number) => void
  signal?: AbortSignal
}): Promise<UploadSession> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException("Upload cancelled", "AbortError"))
      return
    }

    const formData = new FormData()
    formData.append("_method", "PUT")
    formData.append("chunk", chunk, `${partNumber}.part`)

    const request = new XMLHttpRequest()
    request.open(
      "POST",
      `${API_URL}/api/uploads/${uploadSessionId}/parts/${partNumber}`
    )
    request.withCredentials = true
    request.setRequestHeader("Accept", "application/json")
    request.setRequestHeader("X-Requested-With", "XMLHttpRequest")

    const xsrfToken = getXsrfToken()
    if (xsrfToken) {
      request.setRequestHeader("X-XSRF-TOKEN", xsrfToken)
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress?.(event.loaded)
      }
    }

    const handleAbort = () => {
      request.abort()
      reject(new DOMException("Upload cancelled", "AbortError"))
    }

    signal?.addEventListener("abort", handleAbort, { once: true })

    request.onload = () => {
      signal?.removeEventListener("abort", handleAbort)
      const contentType = request.getResponseHeader("content-type")
      const body = contentType?.includes("application/json")
        ? JSON.parse(request.responseText)
        : null

      if (request.status < 200 || request.status >= 300) {
        reject(
          new ApiError(
            body?.message ?? "Upload part failed",
            request.status,
            body?.errors
          )
        )
        return
      }

      resolve((body as ApiResource<UploadSession>).data)
    }

    request.onerror = () => {
      signal?.removeEventListener("abort", handleAbort)
      reject(new ApiError("Upload part failed", request.status || 0))
    }

    request.onabort = () => {
      signal?.removeEventListener("abort", handleAbort)
      reject(new DOMException("Upload cancelled", "AbortError"))
    }

    request.send(formData)
  })
}
