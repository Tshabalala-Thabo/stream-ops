import { existsSync, readFileSync } from "node:fs"
import { resolve } from "node:path"

export function loadLocalEnv() {
  for (const filePath of [
    resolve(process.cwd(), "apps/web/.env.local"),
    resolve(process.cwd(), "apps/web/.env"),
    resolve(process.cwd(), "../web/.env.local"),
    resolve(process.cwd(), "../web/.env"),
  ]) {
    if (!existsSync(filePath)) {
      continue
    }

    const contents = readFileSync(filePath, "utf8")
    for (const line of contents.split(/\r?\n/)) {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith("#")) {
        continue
      }

      const separatorIndex = trimmed.indexOf("=")
      if (separatorIndex === -1) {
        continue
      }

      const key = trimmed.slice(0, separatorIndex).trim()
      const value = trimmed.slice(separatorIndex + 1).trim()
      process.env[key] ??= value
    }
  }
}
