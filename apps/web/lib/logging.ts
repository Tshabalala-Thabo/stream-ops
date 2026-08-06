import { safeErrorForLog, sanitizeLogFields } from "@streamops/core"

export function logInfo(event: string, fields: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: "info", event, ...sanitizeLogFields(fields) }))
}

export function logWarn(event: string, fields: Record<string, unknown> = {}) {
  console.warn(JSON.stringify({ level: "warn", event, ...sanitizeLogFields(fields) }))
}

export function logError(event: string, fields: Record<string, unknown> = {}) {
  console.error(JSON.stringify({ level: "error", event, ...sanitizeLogFields(fields) }))
}

export function logUnexpectedError(event: string, error: unknown, fields: Record<string, unknown> = {}) {
  logError(event, {
    ...fields,
    error: safeErrorForLog(error),
  })
}
