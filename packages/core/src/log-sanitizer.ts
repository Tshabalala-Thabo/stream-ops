const REDACTED = "[REDACTED]"
const MAX_STRING_LENGTH = 500

const sensitiveKeyPattern =
  /authorization|cookie|token|secret|password|credential|signature|presigned|set-cookie|x-amz-security-token/i

const sensitiveValuePattern =
  /(Authorization=|X-Amz-Signature=|X-Amz-Credential=|X-Amz-Security-Token=|AWSAccessKeyId=|access_token=|id_token=|refresh_token=)/i

export function sanitizeForLog(value: unknown): unknown {
  return sanitizeValue(value)
}

export function sanitizeLogFields(fields: Record<string, unknown>) {
  return Object.fromEntries(
    Object.entries(fields)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, sensitiveKeyPattern.test(key) ? REDACTED : sanitizeValue(value)])
  )
}

export function safeErrorForLog(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: sanitizeString(error.message),
    }
  }

  return {
    name: "UnknownError",
    message: sanitizeString(String(error)),
  }
}

function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) {
    return value
  }

  if (typeof value === "string") {
    return sanitizeString(value)
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return value
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue)
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        sensitiveKeyPattern.test(key) ? REDACTED : sanitizeValue(nestedValue),
      ])
    )
  }

  return sanitizeString(String(value))
}

function sanitizeString(value: string) {
  const sanitized = sensitiveValuePattern.test(value) ? REDACTED : value
  return sanitized.length > MAX_STRING_LENGTH ? `${sanitized.slice(0, MAX_STRING_LENGTH)}...` : sanitized
}
